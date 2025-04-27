import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Cluster, insertContactSchema, Node as NetworkNode } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useFieldArray } from 'react-hook-form';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';

// Extend the schema with validation
const formSchema = insertContactSchema.extend({
  name: z.string().min(1, { message: "Name ist erforderlich" }),
  role: z.string().optional(),
  email: z.string().email({ message: "Ungültige E-Mail-Adresse" }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  emails: z.array(z.string().email({ message: "Ungültige E-Mail-Adresse" })).optional(),
  phones: z.array(z.string()).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  firstContact: z.string().optional(),
  lastContact: z.string().optional(),
  nextFollowUp: z.string().optional(),
  relationshipStatus: z.string().optional(),
  relationshipStrength: z.number().optional(),
  profileImage: z.string().optional().or(z.literal('')),
  communicationPreferences: z.record(z.string(), z.any()).optional(),
  customFields: z.array(z.string()).max(5).optional(),
  clusterId: z.number({ required_error: "Bereich ist erforderlich" }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusters: Cluster[];
  contact?: NetworkNode; // Optional contact for editing mode
  isEdit?: boolean; // Flag to indicate edit mode
}

// Hilfsfunktion: Datum ohne Zeitzonen-Offset formatieren
function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ 
  isOpen, 
  onClose, 
  clusters, 
  contact, 
  isEdit = false 
}) => {
  const { toast } = useToast();
  
  // Set up form with existing contact data if in edit mode
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit && contact ? {
      name: contact.name,
      role: contact.role || '',
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || '',
      company: contact.company || '',
      department: contact.department || '',
      emails: contact.emails || [],
      phones: contact.phones || [],
      socialLinks: contact.socialLinks || {},
      tags: contact.tags || [],
      address: {
        street: contact.address?.street || '',
        city: contact.address?.city || '',
        zip: contact.address?.zip || '',
        country: contact.address?.country || '',
        timezone: contact.address?.timezone || '',
      },
      firstContact: contact.firstContact || '',
      lastContact: contact.lastContact || '',
      nextFollowUp: contact.nextFollowUp || '',
      relationshipStatus: contact.relationshipStatus || '',
      relationshipStrength: contact.relationshipStrength || undefined,
      profileImage: contact.profileImage || '',
      communicationPreferences: contact.communicationPreferences || {},
      customFields: contact.customFields || [],
      clusterId: contact.clusterId,
    } : {
      name: '',
      role: '',
      email: '',
      phone: '',
      notes: '',
      company: '',
      department: '',
      emails: [],
      phones: [],
      socialLinks: {},
      tags: [],
      address: { street: '', city: '', zip: '', country: '', timezone: '' },
      firstContact: '',
      lastContact: '',
      nextFollowUp: '',
      relationshipStatus: '',
      relationshipStrength: undefined,
      profileImage: '',
      communicationPreferences: {},
      customFields: [],
      clusterId: undefined,
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;
  
  // Dynamic Field Arrays
  // @ts-ignore Temporärer Workaround für TypeScript-Typen
  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({ name: 'emails', control: form.control });
  // @ts-ignore Temporärer Workaround für TypeScript-Typen
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({ name: 'phones', control: form.control });
  // @ts-ignore Temporärer Workaround für TypeScript-Typen
  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({ name: 'tags', control: form.control });
  // @ts-ignore Temporärer Workaround für TypeScript-Typen
  const { fields: customFieldsArr, append: appendCustom, remove: removeCustom } = useFieldArray({ name: 'customFields', control: form.control });
  
  // Use effect to reset form when opened in edit mode
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEdit && contact) {
        form.reset({
          name: contact.name,
          role: contact.role || '',
          email: contact.email || '',
          phone: contact.phone || '',
          notes: contact.notes || '',
          company: contact.company || '',
          department: contact.department || '',
          emails: contact.emails || [],
          phones: contact.phones || [],
          socialLinks: contact.socialLinks || {},
          tags: contact.tags || [],
          address: {
            street: contact.address?.street || '',
            city: contact.address?.city || '',
            zip: contact.address?.zip || '',
            country: contact.address?.country || '',
            timezone: contact.address?.timezone || '',
          },
          firstContact: contact.firstContact || '',
          lastContact: contact.lastContact || '',
          nextFollowUp: contact.nextFollowUp || '',
          relationshipStatus: contact.relationshipStatus || '',
          relationshipStrength: contact.relationshipStrength || undefined,
          profileImage: contact.profileImage || '',
          communicationPreferences: contact.communicationPreferences || {},
          customFields: contact.customFields || [],
          clusterId: contact.clusterId,
        });
      } else if (!isEdit) {
        form.reset({ name: '', role: '', email: '', phone: '', notes: '', company: '', department: '', emails: [], phones: [], socialLinks: {}, tags: [], address: { street: '', city: '', zip: '', country: '', timezone: '' }, firstContact: '', lastContact: '', nextFollowUp: '', relationshipStatus: '', relationshipStrength: undefined, profileImage: '', communicationPreferences: {}, customFields: [], clusterId: undefined });
      }
    }
  }, [isOpen, isEdit, contact, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit && contact) {
        // Verwende originalId, wenn vorhanden, sonst extrahiere ID aus dem ID-String
        const contactId = contact.originalId !== undefined 
          ? contact.originalId 
          : parseInt(contact.id.replace('contact-', ''));
          
        // Update existing contact
        await apiRequest('PATCH', `/api/contacts/${contactId}`, data);
      } else {
        // Create new contact
        await apiRequest('POST', '/api/contacts', data);
      }
      
      // Invalidate queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/network'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      
      // Force a refetch to ensure the new data is loaded
      await queryClient.refetchQueries({ queryKey: ['/api/network'] });
      
      toast({
        title: isEdit ? "Kontakt aktualisiert" : "Kontakt hinzugefügt",
        description: isEdit 
          ? `${data.name} wurde erfolgreich aktualisiert.`
          : `${data.name} wurde erfolgreich zum Netzwerk hinzugefügt.`,
      });
      
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to save contact:', error);
      toast({
        title: "Fehler",
        description: isEdit 
          ? "Der Kontakt konnte nicht aktualisiert werden."
          : "Der Kontakt konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };
  
  // Wizard-Zustand
  const [step, setStep] = React.useState<number>(1);
  const totalSteps: number = 4;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-transparent z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto z-60 fixed inset-0 m-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {isEdit ? 'Kontakt bearbeiten' : 'Neuen Kontakt hinzufügen'}
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Wizard-Step-Progress */}
            <div className="mb-4">
              <div className="w-full h-1 bg-gray-200 rounded">
                <motion.div
                  className="h-full bg-blue-500 rounded"
                  initial={{ width: `${((step-1)/totalSteps)*100}%` }}
                  animate={{ width: `${(step/totalSteps)*100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <p className="text-sm text-gray-500">Schritt {step} von {totalSteps}</p>

                {step === 1 && (
                  <>  {/* Basisdaten & Bereichsauswahl */}
                    <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="role" render={({ field }) => <FormItem><FormLabel>Rolle/Position</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="company" render={({ field }) => <FormItem><FormLabel>Firma / Organisation</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="department" render={({ field }) => <FormItem><FormLabel>Abteilung / Team</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="clusterId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bereich</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={v => field.onChange(parseInt(v))} defaultValue={field.value?.toString()} className="grid grid-cols-2 gap-2">
                            {clusters.map(c => (
                              <div key={c.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <RadioGroupItem value={c.id.toString()} id={`cluster-${c.id}`} />
                                <label htmlFor={`cluster-${c.id}`} className="text-sm font-medium">{c.name}</label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage/>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="profileImage" render={({ field }) => (
                      <FormItem>
                        {field.value && <img src={field.value} className="w-24 h-24 rounded-full mb-2 object-cover" />}
                        <div className="inline-flex items-center space-x-2">
                          <label htmlFor="profile-upload">
                            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">Profilbild auswählen</Button>
                          </label>
                          <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = ev => field.onChange(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}
                {step === 2 && (
                  <>  {/* Kontakt & Kommunikation & Notizen */}
                    <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>E-Mail</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="phone" render={({ field }) => <FormItem><FormLabel>Telefon</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="communicationPreferences" render={({ field }) => <FormItem><FormLabel>Kommunikationspräferenzen</FormLabel><FormControl><div className="flex space-x-4">{Boolean(field.value?.email)&&<Badge>E-Mail</Badge>}{Boolean(field.value?.phone)&&<Badge>Telefon</Badge>}{Boolean(field.value?.chat)&&<Badge>Chat</Badge>}</div></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="notes" render={({ field }) => <FormItem><FormLabel>Notizen</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                  </>
                )}
                {step === 3 && (
                  <>  {/* Adresse & Timeline */}
                    {/* Address-Felder */}
                    <FormField control={form.control} name="address.street" render={({ field }) => <FormItem><FormLabel>Straße</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="address.city" render={({ field }) => <FormItem><FormLabel>Stadt</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="address.zip" render={({ field }) => <FormItem><FormLabel>PLZ</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="address.country" render={({ field }) => <FormItem><FormLabel>Land</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="address.timezone" render={({ field }) => <FormItem><FormLabel>Zeitzone</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    {/* Datepicker-Felder */}
                    <FormField control={form.control} name="firstContact" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Erstkontakt</FormLabel>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline">{field.value || 'Datum wählen'}</Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <Calendar
                              selected={field.value ? new Date(field.value + 'T00:00') : undefined}
                              onSelect={date => field.onChange(date ? formatDate(date) : '')}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lastContact" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Letzter Kontakt</FormLabel>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline">{field.value || 'Datum wählen'}</Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <Calendar
                              selected={field.value ? new Date(field.value + 'T00:00') : undefined}
                              onSelect={date => field.onChange(date ? formatDate(date) : '')}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nextFollowUp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nächstes Follow-Up</FormLabel>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline">{field.value || 'Datum wählen'}</Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <Calendar
                              selected={field.value ? new Date(field.value + 'T00:00') : undefined}
                              onSelect={date => field.onChange(date ? formatDate(date) : '')}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}
                {step === 4 && (
                  <>  {/* Beziehung & Zusätze */}
                    <FormField control={form.control} name="relationshipStatus" render={({ field }) => <FormItem><FormLabel>Beziehungsstatus</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                    <FormField control={form.control} name="relationshipStrength" render={({ field }) => <FormItem><FormLabel>Beziehungsstärke</FormLabel><FormControl><Slider value={[field.value??0]} onValueChange={v=>field.onChange(v[0])} min={0} max={5} step={1} /></FormControl><FormMessage/></FormItem>} />
                    {/* dynamische Custom-Felder via useFieldArray */}
                    {customFieldsArr.map((f, idx) => (
                      <div key={f.id} className="flex space-x-2 items-center">
                        <Input {...form.register(`customFields.${idx}` as const)} placeholder="Custom-Feld" />
                        <Button type="button" variant="outline" onClick={() => removeCustom(idx)}>−</Button>
                      </div>
                    ))}
                    <Button type="button" onClick={() => appendCustom('')}>+ Feld</Button>
                  </>
                )}
                <div className="flex justify-between space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Abbrechen</Button>
                  <div className="flex space-x-2">
                    {step > 1 && <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}><ChevronLeft /></Button>}
                    {step < totalSteps && <Button type="button" variant="outline" onClick={form.handleSubmit(() => setStep(s => s + 1))} disabled={isSubmitting}><ChevronRight /></Button>}
                  </div>
                  <Button type="button" className="bg-gradient-to-r from-blue-500 to-purple-500" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>{isEdit ? 'Speichern' : 'Kontakt hinzufügen'}</Button>
                </div>
              </form>
            </Form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddContactModal;
