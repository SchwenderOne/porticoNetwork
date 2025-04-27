import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { insertClusterSchema, Node as NetworkNode } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';

// Form Schema Validierung
const formSchema = insertClusterSchema.extend({
  name: z.string().min(1, 'Name ist erforderlich').max(50, 'Maximal 50 Zeichen'),
  color: z.string().min(1, 'Farbe ist erforderlich'),
});

type FormValues = z.infer<typeof formSchema>;

interface AddClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit?: boolean;
  cluster?: NetworkNode;
}

const AddClusterModal: React.FC<AddClusterModalProps> = ({
  isOpen,
  onClose,
  isEdit = false,
  cluster,
}) => {
  const { toast } = useToast();
  
  // Form Setup mit Prefill für Edit und onBlur-Validierung
  const form = useForm<FormValues>({
    mode: 'onBlur',
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: isEdit && cluster ? cluster.name : '',
      color: isEdit && cluster ? cluster.color || 'rgba(144, 238, 144, 0.45)' : 'rgba(144, 238, 144, 0.45)',
    },
  });
  
  // Ref für automatischen Fokus
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Prefill on cluster change
  useEffect(() => {
    if (isEdit && cluster) {
      form.reset({ name: cluster.name, color: cluster.color || '' });
    }
  }, [isEdit, cluster]);
  
  // Fokus auf Namensfeld, wenn Modal geöffnet
  useEffect(() => {
    if (isOpen) {
      nameInputRef.current?.focus();
    }
  }, [isOpen]);
  
  const isSubmitting = form.formState.isSubmitting;
  
  // Vordefinierte Farbpalette
  const colorOptions = [
    'rgba(173, 216, 230, 0.45)', // Hellblau
    'rgba(144, 238, 144, 0.45)', // Hellgrün
    'rgba(221, 160, 221, 0.45)', // Flieder
    'rgba(255, 255, 224, 0.45)', // Hellgelb
    'rgba(255, 182, 193, 0.45)', // Hellrosa
    'rgba(240, 230, 140, 0.45)', // Khaki
    'rgba(176, 224, 230, 0.45)', // Pulverblau
    'rgba(255, 218, 185, 0.45)', // Pfirsich
  ];
  
  const onSubmit = async (data: FormValues) => {
    // Duplikat-Check
    if (!isEdit || (cluster && data.name !== cluster.name)) {
      const resClusters = await apiRequest('GET', '/api/clusters');
      const existing = (await resClusters.json()) as Array<{ name: string }>;
      if (existing.some(c => c.name.trim().toLowerCase() === data.name.trim().toLowerCase())) {
        form.setError('name', { type: 'manual', message: 'Bereich existiert bereits' });
        return;
      }
    }
    try {
      if (isEdit && cluster?.originalId) {
        await apiRequest('PATCH', `/api/clusters/${cluster.originalId}`, data);
        toast({ title: 'Bereich aktualisiert', description: `${data.name} wurde erfolgreich aktualisiert.` });
      } else {
        await apiRequest('POST', '/api/clusters', data);
        toast({ title: 'Bereich hinzugefügt', description: `${data.name} wurde erfolgreich hinzugefügt.` });
      }
      // Erfolgreiches Speichern, Parent-Komponente führt Refetch durch
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to save cluster:', error);
      toast({ title: 'Fehler', description: 'Bereich konnte nicht gespeichert werden.', variant: 'destructive' });
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 m-auto glass rounded-2xl p-6 max-w-md w-full mx-4 flex flex-col h-[80vh] z-60"
            onKeyDown={e => e.key === 'Escape' && onClose()}
            tabIndex={-1}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {isEdit ? 'Bereich bearbeiten' : 'Neuen Bereich hinzufügen'}
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Formular & Vorschau container mit automatischem Scroll bei Überhang */}
            <div className="flex-1 overflow-y-auto">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6 h-full">
                  {/* Linke Spalte: Formularfelder */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bereichsname</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="z.B. Marketing, Finanzen, Technologie..."
                              {...field}
                              ref={nameInputRef}
                              aria-invalid={form.formState.errors.name ? true : false}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bereichsfarbe</FormLabel>
                          <div className="grid grid-cols-4 gap-2 mb-2">
                            {colorOptions.map((color, index) => (
                              <div
                                key={index}
                                className={`h-10 rounded-md cursor-pointer border-2 ${field.value === color ? 'border-primary' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                                onClick={() => form.setValue('color', color)}
                              />
                            ))}
                          </div>
                          <FormControl>
                            <Input
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Rechte Spalte: Vorschau und Buttons */}
                  <div className="flex flex-col h-full">
                    {/* Live-Vorschau */}
                    <div className="flex items-center justify-center p-4 bg-white/10 rounded-lg">
                      <div className="glass p-4 rounded-lg border" style={{ backgroundColor: form.watch('color') }}>
                        <strong>{form.watch('name') || 'Vorschau'}</strong>
                      </div>
                    </div>
                    {/* Buttons */}
                    <div className="mt-auto flex justify-end space-x-3 pt-4">
                      <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Abbrechen</Button>
                      <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90" disabled={isSubmitting}>
                        {isSubmitting ? (isEdit ? 'Wird aktualisiert…' : 'Wird hinzugefügt…') : (isEdit ? 'Speichern' : 'Hinzufügen')}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddClusterModal;