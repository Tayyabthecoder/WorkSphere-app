import React, { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  RefreshCw,
  Edit,
  Eye,
  CheckCircle2,
  Code,
  Save,
  Loader2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import apiClient from '../../../api/client';

export const EmailTemplateManagerView: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editHtml, setEditHtml] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Preview Mode
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/admin/email-templates');
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load email templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEditClick = (template: any) => {
    setEditingTemplate(template);
    setEditSubject(template.subjectLine);
    setEditHtml(template.htmlBody);
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate) return;
    try {
      setIsSaving(true);
      await apiClient.put(`/v1/admin/email-templates/${editingTemplate.templateId}`, {
        subjectLine: editSubject,
        htmlBody: editHtml,
      });
      fetchTemplates();
      setEditingTemplate(null);
    } catch (err) {
      console.error('Failed to update email template:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              System Email Templates
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure automated transactional email copy, notification layouts, and placeholder tokens.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={fetchTemplates}
        >
          Refresh
        </Button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-xs text-text-muted">
            Loading email templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-xs text-text-muted">
            No system email templates found.
          </div>
        ) : (
          templates.map((tmpl) => (
            <Card key={tmpl.templateId} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded border border-brand-emerald/20">
                    {tmpl.key}
                  </span>
                  <Badge variant={tmpl.isActive ? 'completed' : 'neutral'} size="sm">
                    {tmpl.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-text-primary">{tmpl.name}</h3>
                <p className="text-xs text-text-secondary mt-1 font-medium">
                  Subject: <span className="text-text-primary font-normal">{tmpl.subjectLine}</span>
                </p>

                {/* Variable Tokens */}
                {tmpl.variables && tmpl.variables.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {tmpl.variables.map((v: string) => (
                      <span
                        key={v}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-low text-text-muted border border-border/80"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setPreviewTemplate(tmpl)}
                >
                  Preview
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit className="w-3.5 h-3.5" />}
                  onClick={() => handleEditClick(tmpl)}
                >
                  Edit Template
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <Modal
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          title={`Edit ${editingTemplate.name}`}
          description={`Template Key: ${editingTemplate.key}`}
          icon={<Edit className="w-4 h-4 text-brand-emerald" />}
          maxWidth="lg"
        >
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Subject Line
              </label>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Subject line with {{variables}}..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-primary">
                  HTML Body Content
                </label>
                <span className="text-[11px] text-text-muted font-mono">HTML Format</span>
              </div>
              <textarea
                value={editHtml}
                onChange={(e) => setEditHtml(e.target.value)}
                rows={10}
                className="w-full p-3 font-mono text-xs rounded-xl bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
              <Button variant="secondary" size="sm" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving}
                leftIcon={isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              >
                Save Template
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Preview HTML Modal */}
      {previewTemplate && (
        <Modal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          title={previewTemplate.name}
          description={`Subject: ${previewTemplate.subjectLine}`}
          icon={<Eye className="w-4 h-4 text-brand-emerald" />}
          maxWidth="lg"
        >
          <div className="flex flex-col gap-3 py-2">
            <div
              className="p-6 bg-white text-slate-900 rounded-xl border border-border/80 min-h-[250px]"
              dangerouslySetInnerHTML={{ __html: previewTemplate.htmlBody }}
            />
            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setPreviewTemplate(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmailTemplateManagerView;
