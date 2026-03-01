import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Shield, User as UserIcon, GraduationCap, Users as UsersIcon, AlertCircle, Search, Filter } from "lucide-react";
import { SidebarLayout } from "@/components/layout";
import { Card, Button, Badge, Modal, Input, Label, Select } from "@/components/ui";
import { useUsers, useCreateUser, useDeleteUser } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function AdminDashboard() {
  const { data: users, isLoading } = useUsers();
  const createMutation = useCreateUser();
  const deleteMutation = useDeleteUser();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [form, setForm] = useState({ username: "", password: "", role: "student", group: "", linkedStudentId: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const students = users?.filter(u => u.role === "student") || [];

  const filteredUsersWithGroup = users?.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesGroup = groupFilter === "all" || u.group === groupFilter;
    return matchesSearch && matchesRole && matchesGroup;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      toast({ title: "Validation Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      ...form,
      group: form.role === "student" ? form.group : undefined,
      linkedStudentId: form.role === "parent" && form.linkedStudentId ? parseInt(form.linkedStudentId) : undefined
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setForm({ username: "", password: "", role: "student", group: "", linkedStudentId: "" });
        setConfirmPassword("");
        toast({ title: "User Created", description: "The new user account is ready." });
      }
    });
  };

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete, {
        onSuccess: () => {
          setIsDeleteConfirmOpen(false);
          toast({ title: "User Deleted", description: "The user account has been removed." });
        }
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin': return <Shield size={16} className="text-destructive" />;
      case 'teacher': return <UserIcon size={16} className="text-primary" />;
      case 'student': return <GraduationCap size={16} className="text-emerald-600" />;
      case 'parent': return <UsersIcon size={16} className="text-amber-600" />;
      default: return null;
    }
  };

  const roleCounts = users?.reduce((acc: any, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, { student: 0, teacher: 0, parent: 0, admin: 0 }) || { student: 0, teacher: 0, parent: 0, admin: 0 };

  return (
    <SidebarLayout role="admin">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2 text-lg">Create and manage portal access</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="hover-elevate">
          <Plus size={20} className="mr-2" /> Add User
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 flex items-center gap-4 bg-emerald-50 border-emerald-100">
          <GraduationCap className="text-emerald-600" size={32} />
          <div>
            <p className="text-sm text-emerald-600 font-medium uppercase tracking-wider">Students</p>
            <p className="text-2xl font-bold">{roleCounts.student}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-primary/10 border-primary/20">
          <UserIcon className="text-primary" size={32} />
          <div>
            <p className="text-sm text-primary font-medium uppercase tracking-wider">Teachers</p>
            <p className="text-2xl font-bold">{roleCounts.teacher}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-amber-50 border-amber-100">
          <UsersIcon className="text-amber-600" size={32} />
          <div>
            <p className="text-sm text-amber-600 font-medium uppercase tracking-wider">Parents</p>
            <p className="text-2xl font-bold">{roleCounts.parent}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-destructive/10 border-destructive/20">
          <Shield className="text-destructive" size={32} />
          <div>
            <p className="text-sm text-destructive font-medium uppercase tracking-wider">Admins</p>
            <p className="text-2xl font-bold">{roleCounts.admin}</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search users..." 
            className="pl-10" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted-foreground" />
          <Select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setGroupFilter("all"); }}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </Select>
        </div>
        {roleFilter === "student" && (
          <div className="flex items-center gap-2">
            <Select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
              <option value="all">All Groups</option>
              <option value="eamcet">EAMCET</option>
              <option value="iit">IIT</option>
              <option value="neet">NEET</option>
              <option value="defence">DEFENCE</option>
            </Select>
          </div>
        )}
      </div>

      <Card className="p-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-sm font-medium text-muted-foreground">
                <th className="p-4">ID</th>
                <th className="p-4">Username</th>
                <th className="p-4">Role</th>
                <th className="p-4">Details</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading users...</td></tr>
              ) : filteredUsersWithGroup?.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
              ) : (
                filteredUsersWithGroup?.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-sm text-muted-foreground">#{u.id}</td>
                    <td className="p-4 font-medium">{u.username}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(u.role)}
                        <span className="capitalize">{u.role}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {u.role === "student" && u.group && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="uppercase font-bold">{u.group}</Badge>
                        </div>
                      )}
                      {u.role === "parent" && u.linkedStudentId && `Linked to Student #${u.linkedStudentId}`}
                    </td>
                    <td className="p-4 text-right">
                      {u.id !== currentUser?.id && (
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 active-press" onClick={() => handleDeleteClick(u.id)}>
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input required value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input 
              required 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)}
              className={confirmPassword && form.password !== confirmPassword ? "border-destructive" : ""}
            />
            {confirmPassword && form.password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onChange={e => setForm({...form, role: e.target.value, group: "", linkedStudentId: ""})}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          {form.role === "student" && (
            <div className="space-y-2">
              <Label>Group</Label>
              <Select value={form.group} onChange={e => setForm({...form, group: e.target.value})} required>
                <option value="">Select a group...</option>
                <option value="eamcet">EAMCET</option>
                <option value="iit">IIT</option>
                <option value="neet">NEET</option>
                <option value="defence">DEFENCE</option>
              </Select>
            </div>
          )}
          {form.role === "parent" && (
            <div className="space-y-2">
              <Label>Link Student</Label>
              <Select value={form.linkedStudentId} onChange={e => setForm({...form, linkedStudentId: e.target.value})} required>
                <option value="">Select a student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.username} (ID: {s.id})</option>)}
              </Select>
            </div>
          )}
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>Create User</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)} 
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
            <AlertCircle size={24} />
            <p className="font-medium">This action cannot be undone.</p>
          </div>
          <p className="text-muted-foreground">Are you sure you want to delete this user account?</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} loading={deleteMutation.isPending}>
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </SidebarLayout>
  );
}
