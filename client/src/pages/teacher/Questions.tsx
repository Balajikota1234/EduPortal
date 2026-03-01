import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Plus, ArrowLeft, Trash2, Edit2 } from "lucide-react";
import { SidebarLayout } from "@/components/layout";
import { Card, Button, Modal, Input, Label, Select } from "@/components/ui";
import { useQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion, useTests } from "@/hooks/use-teacher";

export default function QuestionsPage() {
  const [, params] = useRoute("/teacher/tests/:testId/questions");
  const testId = Number(params?.testId);
  
  const { data: tests } = useTests();
  const test = tests?.find(t => t.id === testId);
  const { data: questions, isLoading } = useQuestions(testId);
  
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<any>(null);
  
  const defaultForm = { question: "", opt1: "", opt2: "", opt3: "", opt4: "", correctOpt: 1 };
  const [form, setForm] = useState(defaultForm);

  const handleOpenCreate = () => {
    setEditingQ(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: any) => {
    setEditingQ(q);
    setForm({ question: q.question, opt1: q.opt1, opt2: q.opt2, opt3: q.opt3, opt4: q.opt4, correctOpt: q.correctOpt });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, correctOpt: Number(form.correctOpt) };
    if (editingQ) {
      updateMutation.mutate({ id: editingQ.id, testId, ...payload }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      createMutation.mutate({ testId, ...payload }, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  if (!testId) return null;

  return (
    <SidebarLayout role="teacher">
      <div className="mb-6">
        <Link href="/teacher">
          <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Manage Questions</h1>
          <p className="text-muted-foreground mt-2 text-lg">For test: <span className="font-semibold text-primary">{test?.title}</span></p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus size={20} className="mr-2" /> Add Question
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading questions...</p>
        ) : questions?.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed border-2">No questions added yet. Create one to get started.</Card>
        ) : (
          questions?.map((q, index) => (
            <Card key={q.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">{index + 1}</span>
                    <h3 className="text-xl font-medium text-zinc-900">{q.question}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-11">
                    {[q.opt1, q.opt2, q.opt3, q.opt4].map((opt, i) => (
                      <div key={i} className={`p-3 rounded-xl border ${q.correctOpt === i + 1 ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200 bg-zinc-50'}`}>
                        <span className="text-sm font-semibold mr-2 text-zinc-400">{i + 1}.</span> {opt}
                        {q.correctOpt === i + 1 && <span className="float-right text-emerald-600 text-xs font-bold">✓ Correct</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-6">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(q)}><Edit2 size={16} className="mr-2"/> Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => {
                    if(confirm("Delete question?")) deleteMutation.mutate({ id: q.id, testId });
                  }}><Trash2 size={16} className="mr-2"/> Delete</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingQ ? "Edit Question" : "Add Question"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Question Text</Label>
            <Input required value={form.question} onChange={e => setForm({...form, question: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Option 1</Label>
              <Input required value={form.opt1} onChange={e => setForm({...form, opt1: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Option 2</Label>
              <Input required value={form.opt2} onChange={e => setForm({...form, opt2: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Option 3</Label>
              <Input required value={form.opt3} onChange={e => setForm({...form, opt3: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Option 4</Label>
              <Input required value={form.opt4} onChange={e => setForm({...form, opt4: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Correct Option</Label>
            <Select value={form.correctOpt} onChange={e => setForm({...form, correctOpt: Number(e.target.value)})}>
              <option value={1}>Option 1</option>
              <option value={2}>Option 2</option>
              <option value={3}>Option 3</option>
              <option value={4}>Option 4</option>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingQ ? "Save Changes" : "Add Question"}
            </Button>
          </div>
        </form>
      </Modal>
    </SidebarLayout>
  );
}
