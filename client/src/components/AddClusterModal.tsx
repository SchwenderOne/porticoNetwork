import React, { useEffect } from 'react';
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

// Form Schema Validierung
const formSchema = insertClusterSchema.extend({
  name: z.string().min(1, 'Name ist erforderlich'),
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
  
  // Form Setup mit Prefill für Edit
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: isEdit && cluster ? cluster.name : '',
      color: isEdit && cluster ? cluster.color || 'rgba(144, 238, 144, 0.45)' : 'rgba(144, 238, 144, 0.45)',
    },
  });
  // Prefill on cluster change
  useEffect(() => {
    if (isEdit && cluster) {
      form.reset({ name: cluster.name, color: cluster.color || '' });
    }
  }, [isEdit, cluster]);
  
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
    try {
      if (isEdit && cluster?.originalId) {
        // Bereich aktualisieren
        await apiRequest('PATCH', `/api/clusters/${cluster.originalId}`, data);
        toast({
          title: "Bereich aktualisiert",
          description: `${data.name} wurde erfolgreich aktualisiert.`,
        });
      } else {
        // Neuer Bereich
      await apiRequest('POST', '/api/clusters', data);
        toast({
          title: "Bereich hinzugefügt",
          description: `${data.name} wurde erfolgreich zum Netzwerk hinzugefügt.`,
        });
      }
      // Queries invalidieren und sofort neu laden
      await queryClient.invalidateQueries({ queryKey: ['/api/network'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/clusters'] });
      await queryClient.refetchQueries({ queryKey: ['/api/network'] });
      await queryClient.refetchQueries({ queryKey: ['/api/clusters'] });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to save cluster:', error);
      toast({
        title: "Fehler",
        description: "Der Bereich konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="glass rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            Neuen Bereich hinzufügen
          </h3>
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
                  <FormLabel>Bereichsname</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="z.B. Marketing, Finanzen, Technologie..." 
                      {...field} 
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

export default AddClusterModal;