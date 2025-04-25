import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Cluster, insertContactSchema } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Extend the schema with validation
const formSchema = insertContactSchema.extend({
  name: z.string().min(1, { message: "Name ist erforderlich" }),
  role: z.string().min(1, { message: "Rolle ist erforderlich" }),
  email: z.string().email({ message: "Ungültige E-Mail-Adresse" }).optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  clusterId: z.number({ required_error: "Bitte wählen Sie einen Cluster aus" }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusters: Cluster[];
}

const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, clusters }) => {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      role: '',
      email: '',
      phone: '',
      notes: '',
      clusterId: undefined,
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;
  
  const onSubmit = async (data: FormValues) => {
    try {
      await apiRequest('POST', '/api/contacts', data);
      queryClient.invalidateQueries({ queryKey: ['/api/network'] });
      toast({
        title: "Kontakt hinzugefügt",
        description: `${data.name} wurde erfolgreich zum Netzwerk hinzugefügt.`,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to add contact:', error);
      toast({
        title: "Fehler",
        description: "Der Kontakt konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="glass rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Neuen Kontakt hinzufügen</h3>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Max Mustermann" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rolle/Position</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="CEO, Investor, Entwickler..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="email@beispiel.de" 
                      type="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+49 123 456789" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Zusätzliche Informationen..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="clusterId"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Cluster auswählen</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      className="grid grid-cols-2 gap-2"
                    >
                      {clusters.map((cluster) => (
                        <div key={cluster.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem 
                            value={cluster.id.toString()} 
                            id={`cluster-${cluster.id}`} 
                          />
                          <label 
                            htmlFor={`cluster-${cluster.id}`}
                            className="text-sm font-medium"
                          >
                            {cluster.name}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Wird hinzugefügt...' : 'Hinzufügen'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AddContactModal;
