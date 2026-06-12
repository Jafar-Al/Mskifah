import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Loader2, Search, UploadCloud, Lock, Unlock, Image, X, KeyRound } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Week, Question } from '@/data/questions';
import { WazariLesson, WazariQuestion } from '@/data/wazariQuestions';
import { useToast } from '@/hooks/use-toast';
import {
    Resource,
    SemesterKey,
    SEMESTER_TABS,
    UNITS_BY_SEMESTER,
    unitLabel,
} from '@/data/resources';
import type { FileCategory } from '@/data/resources';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    score: number;
    created_at: string;
    answered_count: number;
    correct_count: number;
}

// ── Shared Image Upload Field ────────────────────────────────────────────────

function ImageField({
    imageUrl,
    setImageUrl,
    token,
}: {
    imageUrl: string;
    setImageUrl: (v: string) => void;
    token: string | null;
}) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [imageMode, setImageMode] = useState<'none' | 'url' | 'upload'>(imageUrl ? 'url' : 'none');

    const handleUpload = async (file: File) => {
        if (!token) return;
        setUploading(true);
        setUploadError('');
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'فشل الرفع');
            setImageUrl(data.url);
            setImageMode('upload');
        } catch (e: any) {
            setUploadError(e.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label>صورة السؤال (اختياري)</Label>
            <div className="flex gap-2">
                <Button type="button" size="sm" variant={imageMode === 'none' ? 'default' : 'outline'} onClick={() => { setImageMode('none'); setImageUrl(''); }}>بدون صورة</Button>
                <Button type="button" size="sm" variant={imageMode === 'url' ? 'default' : 'outline'} onClick={() => setImageMode('url')}>رابط URL</Button>
                <Button type="button" size="sm" variant={imageMode === 'upload' ? 'default' : 'outline'} onClick={() => setImageMode('upload')}>رفع صورة</Button>
            </div>

            {imageMode === 'url' && (
                <Input
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    dir="ltr"
                />
            )}

            {imageMode === 'upload' && (
                <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); }}
                    className={['border border-dashed rounded-xl p-4 text-center transition-colors bg-background/40', isDragging ? 'border-primary bg-primary/10' : 'border-border'].join(' ')}
                >
                    <UploadCloud className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm">اسحب صورة هنا أو</p>
                    <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? 'جارٍ الرفع...' : 'اختر صورة'}
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                    {uploadError && <p className="text-xs text-destructive mt-1">{uploadError}</p>}
                    {imageUrl && <p className="text-xs text-muted-foreground mt-1 truncate">تم الرفع: {imageUrl}</p>}
                </div>
            )}

            {imageUrl && imageMode !== 'none' && (
                <div className="relative mt-1 rounded-xl overflow-hidden border border-border">
                    <img src={imageUrl} alt="معاينة" className="w-full max-h-32 object-contain bg-muted" />
                    <button type="button" onClick={() => { setImageUrl(''); setImageMode('none'); }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Shared question form fields ──────────────────────────────────────────────

function QuestionFormFields({
    qText, setQText,
    opts, setOpts,
    correct, setCorrect,
    pts, setPts,
    imgUrl, setImgUrl,
    token,
}: {
    qText: string; setQText: (v: string) => void;
    opts: string[]; setOpts: (v: string[]) => void;
    correct: string; setCorrect: (v: string) => void;
    pts: string; setPts: (v: string) => void;
    imgUrl: string; setImgUrl: (v: string) => void;
    token: string | null;
}) {
    return (
        <>
            <div className="space-y-2">
                <Label>نص السؤال</Label>
                <Input value={qText} onChange={e => setQText(e.target.value)} required dir="rtl" />
            </div>
            {opts.map((opt, idx) => (
                <div key={idx} className="space-y-2">
                    <Label>الخيار {idx + 1}</Label>
                    <Input value={opt} onChange={e => { const n = [...opts]; n[idx] = e.target.value; setOpts(n); }} required dir="rtl" />
                </div>
            ))}
            <div className="space-y-2">
                <Label>الإجابة الصحيحة</Label>
                <Select value={correct} onValueChange={setCorrect}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">الخيار 1</SelectItem>
                        <SelectItem value="1">الخيار 2</SelectItem>
                        <SelectItem value="2">الخيار 3</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>النقاط</Label>
                <Input type="number" value={pts} onChange={e => setPts(e.target.value)} required />
            </div>
            <ImageField imageUrl={imgUrl} setImageUrl={setImgUrl} token={token} />
        </>
    );
}

// ── Main Admin Component ─────────────────────────────────────────────────────

export default function Admin() {
    const { token, user: currentUser } = useAuth();
    const { toast } = useToast();

    // Regular challenges
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [weekId, setWeekId] = useState('1');
    const [weekTitle, setWeekTitle] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '']);
    const [correctAnswer, setCorrectAnswer] = useState('0');
    const [points, setPoints] = useState('10');
    const [questionImageUrl, setQuestionImageUrl] = useState('');

    // Wazari
    const [wazariLessons, setWazariLessons] = useState<WazariLesson[]>([]);
    const [loadingWazari, setLoadingWazari] = useState(true);
    const [editingWazariQuestion, setEditingWazariQuestion] = useState<WazariQuestion | null>(null);
    const [isWazariDialogOpen, setIsWazariDialogOpen] = useState(false);
    const [wazariLessonId, setWazariLessonId] = useState('1');
    const [wazariQuestionText, setWazariQuestionText] = useState('');
    const [wazariOptions, setWazariOptions] = useState(['', '', '']);
    const [wazariCorrectAnswer, setWazariCorrectAnswer] = useState('0');
    const [wazariPoints, setWazariPoints] = useState('10');
    const [wazariImageUrl, setWazariImageUrl] = useState('');

    // Resources
    const [resources, setResources] = useState<Resource[]>([]);
    const [loadingResources, setLoadingResources] = useState(true);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
    const [resourceType, setResourceType] = useState<Resource['type']>('video');
    const [resourceTitle, setResourceTitle] = useState('');
    const [resourceUrl, setResourceUrl] = useState('');
    const [resourceDescription, setResourceDescription] = useState('');
    const [resourceSemester, setResourceSemester] = useState<'1' | '2'>('1');
    const [resourceUnit, setResourceUnit] = useState('1');
    const [resourceCategory, setResourceCategory] = useState<FileCategory>('worksheets');
    const [resourceSource, setResourceSource] = useState<'upload' | 'link'>('upload');
    const [resourceFilter, setResourceFilter] = useState<Resource['type'] | 'all'>('all');
    const [resourceQuery, setResourceQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Users
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [userQuery, setUserQuery] = useState('');
    const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
    const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => { fetchQuestions(); fetchResources(); fetchWazari(); }, []);
    useEffect(() => { if (token) fetchUsers(); }, [token]);
    useEffect(() => {
        const allowed = UNITS_BY_SEMESTER[parseInt(resourceSemester) as SemesterKey];
        if (!allowed.includes(parseInt(resourceUnit))) setResourceUnit(allowed[0].toString());
    }, [resourceSemester, resourceUnit]);

    const fetchQuestions = () => {
        setLoading(true);
        fetch('/api/questions', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
            .then(res => res.json()).then(data => { setWeeks(data); setLoading(false); });
    };

    const fetchWazari = () => {
        setLoadingWazari(true);
        fetch('/api/wazari/lessons', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
            .then(res => res.json()).then(data => { setWazariLessons(data); setLoadingWazari(false); });
    };

    const fetchResources = () => {
        setLoadingResources(true);
        fetch('/api/resources').then(res => res.json()).then(data => { setResources(data); setLoadingResources(false); });
    };

    const fetchUsers = () => {
        if (!token) return;
        setLoadingUsers(true);
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
            .then(async res => {
                if (!res.ok) { setUsers([]); setLoadingUsers(false); return; }
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []); setLoadingUsers(false);
            }).catch(() => { setUsers([]); setLoadingUsers(false); });
    };

    // ── Reset helpers ────────────────────────────────────────────────────────

    const resetForm = () => {
        setEditingQuestion(null); setQuestionText(''); setOptions(['', '', '']);
        setCorrectAnswer('0'); setPoints('10'); setWeekTitle(''); setQuestionImageUrl('');
    };

    const resetWazariForm = () => {
        setEditingWazariQuestion(null); setWazariQuestionText(''); setWazariOptions(['', '', '']);
        setWazariCorrectAnswer('0'); setWazariPoints('10'); setWazariImageUrl('');
    };

    const resetResourceForm = () => {
        setEditingResource(null); setResourceType('video'); setResourceTitle(''); setResourceUrl('');
        setResourceDescription(''); setResourceSemester('1'); setResourceUnit('1');
        setResourceCategory('worksheets'); setResourceSource('upload'); setUploadError(''); setIsUploading(false);
    };

    const resetUserForm = () => { setEditingUser(null); setUserName(''); };

    // ── Edit handlers ────────────────────────────────────────────────────────

    const handleEdit = (q: Question, wId: number) => {
        setEditingQuestion(q); setWeekId(wId.toString()); setQuestionText(q.question);
        setOptions([...q.options]); setCorrectAnswer(q.correctAnswer.toString());
        setPoints(q.points.toString()); setQuestionImageUrl(q.imageUrl || '');
        setIsDialogOpen(true);
    };

    const handleWazariEdit = (q: WazariQuestion, lId: number) => {
        setEditingWazariQuestion(q); setWazariLessonId(lId.toString()); setWazariQuestionText(q.question);
        setWazariOptions([...q.options]); setWazariCorrectAnswer(q.correctAnswer.toString());
        setWazariPoints(q.points.toString()); setWazariImageUrl(q.imageUrl || '');
        setIsWazariDialogOpen(true);
    };

    const handleResourceEdit = (r: Resource) => {
        setEditingResource(r); setResourceType(r.type); setResourceTitle(r.title);
        setResourceUrl(r.url); setResourceDescription(r.description);
        setResourceSemester(r.semester.toString() as '1' | '2'); setResourceUnit(r.unit.toString());
        setResourceCategory((r.category as FileCategory) || 'worksheets');
        setResourceSource(r.url?.startsWith('/uploads/') ? 'upload' : 'link');
        setIsResourceDialogOpen(true);
    };

    const handleUserEdit = (u: AdminUser) => { setEditingUser(u); setUserName(u.name); setIsUserDialogOpen(true); };

    // ── Delete handlers ──────────────────────────────────────────────────────

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
        const res = await fetch(`/api/questions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { toast({ title: 'تم', description: 'حُذف السؤال' }); fetchQuestions(); }
        else toast({ title: 'خطأ', variant: 'destructive', description: 'فشل الحذف' });
    };

    const handleWazariDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
        const res = await fetch(`/api/wazari/questions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { toast({ title: 'تم', description: 'حُذف السؤال' }); fetchWazari(); }
        else toast({ title: 'خطأ', variant: 'destructive', description: 'فشل الحذف' });
    };

    const handleResourceDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المرجع؟')) return;
        const res = await fetch(`/api/resources/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { toast({ title: 'تم', description: 'حُذف المرجع' }); fetchResources(); }
        else toast({ title: 'خطأ', variant: 'destructive', description: 'فشل الحذف' });
    };

    const handleUserSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: userName })
        });
        if (res.ok) { toast({ title: 'تم', description: 'تم تحديث المستخدم' }); setIsUserDialogOpen(false); resetUserForm(); fetchUsers(); }
        else { const d = await res.json().catch(() => ({})); toast({ title: 'خطأ', variant: 'destructive', description: d?.error || 'فشل التحديث' }); }
    };

    const handleUserDelete = async (userId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
        const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { toast({ title: 'تم', description: 'حُذف الحساب' }); fetchUsers(); }
        else { const d = await res.json().catch(() => ({})); toast({ title: 'خطأ', variant: 'destructive', description: d?.error || 'فشل الحذف' }); }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetPasswordUser) return;
        const res = await fetch(`/api/admin/users/${resetPasswordUser.id}/reset-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ password: newPassword })
        });
        if (res.ok) { toast({ title: 'تم', description: `تم تغيير كلمة المرور لـ ${resetPasswordUser.name}` }); setIsResetPasswordDialogOpen(false); setResetPasswordUser(null); setNewPassword(''); }
        else { const d = await res.json().catch(() => ({})); toast({ title: 'خطأ', variant: 'destructive', description: d?.error || 'فشل تغيير كلمة المرور' }); }
    };

    // ── Submit handlers ──────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const resolvedWeekTitle = weekTitle || `Week ${weekId}`;
        const payload = { weekId: parseInt(weekId), weekTitle: resolvedWeekTitle, question: questionText, options, correctAnswer: parseInt(correctAnswer), points: parseInt(points), imageUrl: questionImageUrl || null };
        const url = editingQuestion ? `/api/questions/${editingQuestion.id}` : '/api/questions';
        const method = editingQuestion ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
        if (res.ok) { toast({ title: 'تم', description: 'تم حفظ السؤال' }); setIsDialogOpen(false); resetForm(); fetchQuestions(); }
        else toast({ title: 'خطأ', variant: 'destructive', description: 'فشل الحفظ' });
    };

    const handleWazariSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { lessonId: parseInt(wazariLessonId), question: wazariQuestionText, options: wazariOptions, correctAnswer: parseInt(wazariCorrectAnswer), points: parseInt(wazariPoints), imageUrl: wazariImageUrl || null };
        const url = editingWazariQuestion ? `/api/wazari/questions/${editingWazariQuestion.id}` : '/api/wazari/questions';
        const method = editingWazariQuestion ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
        if (res.ok) { toast({ title: 'تم', description: 'تم حفظ السؤال الوزاري' }); setIsWazariDialogOpen(false); resetWazariForm(); fetchWazari(); }
        else toast({ title: 'خطأ', variant: 'destructive', description: 'فشل الحفظ' });
    };

    const handleResourceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (resourceType === 'file' && resourceSource === 'upload' && !resourceUrl) { toast({ title: 'ملف مفقود', variant: 'destructive', description: 'يرجى رفع ملف أولاً.' }); return; }
        if (resourceType === 'file' && resourceSource === 'link' && !resourceUrl) { toast({ title: 'رابط مفقود', variant: 'destructive', description: 'يرجى إدخال رابط.' }); return; }
        const payload = { type: resourceType, title: resourceTitle, url: resourceUrl, description: resourceDescription, semester: parseInt(resourceSemester), unit: parseInt(resourceUnit), category: resourceType === 'file' ? resourceCategory : undefined };
        const url = editingResource ? `/api/resources/${editingResource.id}` : '/api/resources';
        const method = editingResource ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
        if (res.ok) { toast({ title: 'تم', description: 'تم حفظ المرجع' }); setIsResourceDialogOpen(false); resetResourceForm(); fetchResources(); }
        else toast({ title: 'خطأ', variant: 'destructive', description: 'فشل الحفظ' });
    };

    const handleFileUpload = async (file: File) => {
        if (!token) return;
        setIsUploading(true); setUploadError('');
        const fd = new FormData(); fd.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Upload failed');
            setResourceUrl(data.url);
            if (!resourceTitle) setResourceTitle(file.name.replace(/\.[^/.]+$/, ''));
        } catch (err: any) { setUploadError(err.message || 'Upload failed'); }
        finally { setIsUploading(false); }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault(); setIsDragging(false);
        const file = event.dataTransfer.files?.[0]; if (file) handleFileUpload(file);
    };

    // ── Computed ─────────────────────────────────────────────────────────────

    const filteredResources = useMemo(() => {
        const q = resourceQuery.trim().toLowerCase();
        return resources.filter(r => {
            if (resourceFilter !== 'all' && r.type !== resourceFilter) return false;
            if (!q) return true;
            return (r.title ?? '').toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q);
        });
    }, [resources, resourceFilter, resourceQuery]);

    const filteredUsers = useMemo(() => {
        const q = userQuery.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u => (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q));
    }, [users, userQuery]);

    const totalQuestions = useMemo(() => weeks.reduce((acc, w) => acc + w.questions.length, 0), [weeks]);
    const totalWazari = useMemo(() => wazariLessons.reduce((acc, l) => acc + l.questions.length, 0), [wazariLessons]);

    if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="min-h-screen bg-background dna-pattern">
            <Navbar />
            <main className="container mx-auto px-4 pt-24 pb-12">
                <div className="flex flex-col gap-6 mb-10">
                    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                            <p className="text-muted-foreground mt-1">Manage challenges, wazari intensive, files, exams, and videos.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {/* Add Regular Question */}
                            <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                                <DialogTrigger asChild>
                                    <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Add Question</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                                    <DialogHeader><DialogTitle>{editingQuestion ? 'Edit Question' : 'New Question'}</DialogTitle></DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Week ID</Label>
                                            <Input type="number" value={weekId} onChange={e => setWeekId(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Week Title (اختياري)</Label>
                                            <Input value={weekTitle} onChange={e => setWeekTitle(e.target.value)} placeholder={`Week ${weekId}`} />
                                        </div>
                                        <QuestionFormFields
                                            qText={questionText} setQText={setQuestionText}
                                            opts={options} setOpts={setOptions}
                                            correct={correctAnswer} setCorrect={setCorrectAnswer}
                                            pts={points} setPts={setPoints}
                                            imgUrl={questionImageUrl} setImgUrl={setQuestionImageUrl}
                                            token={token}
                                        />
                                        <Button type="submit" className="w-full">حفظ</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Add Wazari Question */}
                            <Dialog open={isWazariDialogOpen} onOpenChange={open => { setIsWazariDialogOpen(open); if (!open) resetWazariForm(); }}>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" onClick={resetWazariForm}><Plus className="mr-2 h-4 w-4" /> سؤال وزاري</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                                    <DialogHeader><DialogTitle dir="rtl">{editingWazariQuestion ? 'تعديل سؤال وزاري' : 'سؤال وزاري جديد'}</DialogTitle></DialogHeader>
                                    <form onSubmit={handleWazariSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>الدرس</Label>
                                            <Select value={wazariLessonId} onValueChange={setWazariLessonId}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {wazariLessons.map(l => (
                                                        <SelectItem key={l.id} value={l.id.toString()}>{l.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <QuestionFormFields
                                            qText={wazariQuestionText} setQText={setWazariQuestionText}
                                            opts={wazariOptions} setOpts={setWazariOptions}
                                            correct={wazariCorrectAnswer} setCorrect={setWazariCorrectAnswer}
                                            pts={wazariPoints} setPts={setWazariPoints}
                                            imgUrl={wazariImageUrl} setImgUrl={setWazariImageUrl}
                                            token={token}
                                        />
                                        <Button type="submit" className="w-full">حفظ</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Add Resource */}
                            <Dialog open={isResourceDialogOpen} onOpenChange={open => { setIsResourceDialogOpen(open); if (!open) resetResourceForm(); }}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={resetResourceForm}><Plus className="mr-2 h-4 w-4" /> Add Resource</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader><DialogTitle>{editingResource ? 'Edit Resource' : 'New Resource'}</DialogTitle></DialogHeader>
                                    <div className="overflow-y-auto max-h-[70vh] pr-1">
                                    <form onSubmit={handleResourceSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select value={resourceType} onValueChange={v => setResourceType(v as Resource['type'])}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="video">Video</SelectItem>
                                                    <SelectItem value="exam">Exam</SelectItem>
                                                    <SelectItem value="file">File</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label>الفصل</Label>
                                                <Select value={resourceSemester} onValueChange={v => setResourceSemester(v as '1' | '2')}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>{SEMESTER_TABS.map(s => <SelectItem key={s.key} value={s.key.toString()}>{s.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>الوحدة</Label>
                                                <Select value={resourceUnit} onValueChange={setResourceUnit}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>{UNITS_BY_SEMESTER[parseInt(resourceSemester) as SemesterKey].map(unit => <SelectItem key={unit} value={unit.toString()}>{unitLabel(unit)}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2"><Label>Title</Label><Input value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} required /></div>
                                        {resourceType === 'file' && (
                                            <div className="space-y-2">
                                                <Label>Source</Label>
                                                <Select value={resourceSource} onValueChange={v => setResourceSource(v as 'upload' | 'link')}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent><SelectItem value="upload">Upload</SelectItem><SelectItem value="link">Link</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        {resourceType === 'file' && (
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <Select value={resourceCategory} onValueChange={v => setResourceCategory(v as FileCategory)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent><SelectItem value="worksheets">أوراق عمل</SelectItem><SelectItem value="cheat">Cheat Sheet</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        {resourceType === 'file' && resourceSource === 'upload' && (
                                            <div className="space-y-2">
                                                <Label>Upload File</Label>
                                                <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={['border border-dashed rounded-xl p-4 text-center transition-colors bg-background/40', isDragging ? 'border-primary bg-primary/10' : 'border-border'].join(' ')}>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <UploadCloud className="w-6 h-6 text-primary" />
                                                        <p className="text-sm font-medium">Drag & drop a file here</p>
                                                        <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>{isUploading ? 'Uploading...' : 'Choose File'}</Button>
                                                        <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                                                        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
                                                        {resourceUrl && <p className="text-xs text-muted-foreground truncate max-w-full">Saved: {resourceUrl}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {(resourceType !== 'file' || resourceSource === 'link') && (
                                            <div className="space-y-2"><Label>URL</Label><Input value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} required /></div>
                                        )}
                                        <div className="space-y-2"><Label>Description</Label><Input value={resourceDescription} onChange={e => setResourceDescription(e.target.value)} required /></div>
                                        <Button type="submit" className="w-full">Save</Button>
                                    </form>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Edit User Dialog */}
                            <Dialog open={isUserDialogOpen} onOpenChange={open => { setIsUserDialogOpen(open); if (!open) resetUserForm(); }}>
                                <DialogContent className="max-w-md">
                                    <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
                                    <form onSubmit={handleUserSave} className="space-y-4">
                                        <div className="space-y-2"><Label>Name</Label><Input value={userName} onChange={e => setUserName(e.target.value)} required /></div>
                                        <Button type="submit" className="w-full">Save</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Reset Password Dialog */}
                            <Dialog open={isResetPasswordDialogOpen} onOpenChange={open => { setIsResetPasswordDialogOpen(open); if (!open) { setResetPasswordUser(null); setNewPassword(''); } }}>
                                <DialogContent className="max-w-md">
                                    <DialogHeader><DialogTitle dir="rtl">إعادة تعيين كلمة المرور</DialogTitle></DialogHeader>
                                    {resetPasswordUser && <p className="text-sm text-muted-foreground" dir="rtl">{resetPasswordUser.name} — {resetPasswordUser.email}</p>}
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>كلمة المرور الجديدة</Label>
                                            <Input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} placeholder="6 أحرف على الأقل" dir="ltr" />
                                        </div>
                                        <Button type="submit" className="w-full">تغيير كلمة المرور</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="glass-card p-4 rounded-xl"><p className="text-sm text-muted-foreground">Total Challenges</p><p className="text-2xl font-semibold">{totalQuestions}</p></div>
                        <div className="glass-card p-4 rounded-xl"><p className="text-sm text-muted-foreground">Wazari Questions</p><p className="text-2xl font-semibold">{totalWazari}</p></div>
                        <div className="glass-card p-4 rounded-xl"><p className="text-sm text-muted-foreground">Total Resources</p><p className="text-2xl font-semibold">{resources.length}</p></div>
                        <div className="glass-card p-4 rounded-xl"><p className="text-sm text-muted-foreground">Videos / Exams / Files</p><p className="text-2xl font-semibold">{resources.filter(r => r.type === 'video').length} / {resources.filter(r => r.type === 'exam').length} / {resources.filter(r => r.type === 'file').length}</p></div>
                    </div>
                </div>

                <Tabs defaultValue="challenges" className="space-y-6">
                    <TabsList className="bg-background/40 border border-border">
                        <TabsTrigger value="challenges">Challenges</TabsTrigger>
                        <TabsTrigger value="wazari">مكثف وزاري</TabsTrigger>
                        <TabsTrigger value="resources">Resources</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                    </TabsList>

                    {/* ── Regular Challenges Tab ── */}
                    <TabsContent value="challenges" className="space-y-8">
                        {weeks.map(week => (
                            <div key={week.id} className="p-6 glass-card rounded-xl">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-semibold">{week.title}</h2>
                                        <span className={`text-xs px-2 py-1 rounded-full ${week.isUnlocked ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{week.isUnlocked ? 'Unlocked' : 'Locked'}</span>
                                    </div>
                                    <Button variant={week.isUnlocked ? 'outline' : 'default'} size="sm" onClick={async () => {
                                        const next = !week.isUnlocked;
                                        const res = await fetch(`/api/weeks/${week.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isUnlocked: next }) });
                                        if (res.ok) { toast({ title: 'Success', description: `Week ${week.id} ${next ? 'unlocked' : 'locked'}` }); fetchQuestions(); }
                                        else toast({ title: 'Error', variant: 'destructive', description: 'Failed to update week' });
                                    }}>
                                        {week.isUnlocked ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                                        {week.isUnlocked ? 'Lock Week' : 'Unlock Week'}
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {week.questions.map(q => (
                                        <div key={q.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 bg-background/50 rounded-lg border">
                                            <div className="flex gap-3 items-start">
                                                {q.imageUrl && <img src={q.imageUrl} alt="" className="w-12 h-12 object-cover rounded border shrink-0" />}
                                                <div>
                                                    <p className="font-medium">{q.question}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">Ans: <span className="font-bold text-green-600 dark:text-green-400">{q.options[q.correctAnswer]}</span> ({q.points} pts)</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(q, week.id)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </TabsContent>

                    {/* ── Wazari Tab ── */}
                    <TabsContent value="wazari" className="space-y-8" dir="rtl">
                        {loadingWazari ? (
                            <div className="p-6 glass-card rounded-xl text-center"><Loader2 className="animate-spin mx-auto" /></div>
                        ) : wazariLessons.map(lesson => (
                            <div key={lesson.id} className="p-6 glass-card rounded-xl">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">{lesson.unitTitle}</p>
                                            <h2 className="text-xl font-semibold">{lesson.title}</h2>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${lesson.isUnlocked ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{lesson.isUnlocked ? 'مفتوح' : 'مغلق'}</span>
                                    </div>
                                    <Button variant={lesson.isUnlocked ? 'outline' : 'default'} size="sm" onClick={async () => {
                                        const next = !lesson.isUnlocked;
                                        const res = await fetch(`/api/wazari/lessons/${lesson.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isUnlocked: next }) });
                                        if (res.ok) { toast({ title: 'تم', description: `${lesson.title} ${next ? 'فُتح' : 'أُغلق'}` }); fetchWazari(); }
                                        else toast({ title: 'خطأ', variant: 'destructive', description: 'فشل التحديث' });
                                    }}>
                                        {lesson.isUnlocked ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                                        {lesson.isUnlocked ? 'إغلاق' : 'فتح'}
                                    </Button>
                                </div>
                                {lesson.questions.length === 0 ? (
                                    <p className="text-muted-foreground text-sm text-center py-4">لا توجد أسئلة لهذا الدرس بعد.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {lesson.questions.map((q, idx) => (
                                            <div key={q.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 bg-background/50 rounded-lg border">
                                                <div className="flex gap-3 items-start">
                                                    {q.imageUrl && <img src={q.imageUrl} alt="" className="w-12 h-12 object-cover rounded border shrink-0" />}
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">س{idx + 1}</p>
                                                        <p className="font-medium">{q.question}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">الإجابة: <span className="font-bold text-green-600 dark:text-green-400">{q.options[q.correctAnswer]}</span> ({q.points} نقطة)</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <Button variant="ghost" size="icon" onClick={() => handleWazariEdit(q, lesson.id)}><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleWazariDelete(q.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </TabsContent>

                    {/* ── Resources Tab ── */}
                    <TabsContent value="resources" className="space-y-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'video', 'exam', 'file'] as const).map(type => (
                                    <Button key={type} type="button" variant={resourceFilter === type ? 'default' : 'outline'} size="sm" onClick={() => setResourceFilter(type)}>
                                        {type === 'all' ? 'All' : type.toUpperCase()}
                                    </Button>
                                ))}
                            </div>
                            <div className="relative w-full md:max-w-sm">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input value={resourceQuery} onChange={e => setResourceQuery(e.target.value)} placeholder="Search resources..." className="pr-9" />
                            </div>
                        </div>
                        {loadingResources ? <div className="p-6 glass-card rounded-xl text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
                            <div className="space-y-3">
                                {filteredResources.map(r => (
                                    <div key={r.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 bg-background/50 rounded-lg border">
                                        <div>
                                            <p className="font-medium">{r.title}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{r.type.toUpperCase()} · {SEMESTER_TABS.find(s => s.key === r.semester)?.label} · {unitLabel(r.unit)}{r.type === 'file' && r.category ? ` · ${r.category === 'worksheets' ? 'أوراق عمل' : 'Cheat Sheet'}` : ''}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">{r.url}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleResourceEdit(r)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleResourceDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                                {filteredResources.length === 0 && <div className="p-6 glass-card rounded-xl text-center text-muted-foreground">No resources found.</div>}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Users Tab ── */}
                    <TabsContent value="users" className="space-y-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="relative w-full md:max-w-sm">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="Search users..." className="pr-9" />
                            </div>
                        </div>
                        {loadingUsers ? <div className="p-6 glass-card rounded-xl text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
                            <div className="space-y-3">
                                {filteredUsers.map(u => {
                                    const isSelf = u.id === currentUser?.id;
                                    return (
                                        <div key={u.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 bg-background/50 rounded-lg border">
                                            <div>
                                                <p className="font-medium">{u.name}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{u.email}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{u.role.toUpperCase()} · {u.score} pts · {u.correct_count}/{u.answered_count} correct</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" title="إعادة تعيين كلمة المرور" onClick={() => { setResetPasswordUser(u); setNewPassword(''); setIsResetPasswordDialogOpen(true); }}><KeyRound className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleUserEdit(u)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isSelf} onClick={() => handleUserDelete(u.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredUsers.length === 0 && <div className="p-6 glass-card rounded-xl text-center text-muted-foreground">No users found.</div>}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
