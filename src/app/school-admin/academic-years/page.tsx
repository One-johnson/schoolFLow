'use client';

import { useState, useCallback, useMemo} from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Grid3x3,
  List,
  CheckCircle,
  Clock,
  Archive,
} from 'lucide-react';
import { AddAcademicYearDialog } from '@/components/academic-years/add-academic-year-dialog';
import { EditAcademicYearDialog } from '@/components/academic-years/edit-academic-year-dialog';
import { ViewAcademicYearDialog } from '@/components/academic-years/view-academic-year-dialog';
import { DeleteAcademicYearDialog } from '@/components/academic-years/delete-academic-year-dialog';
import { BulkDeleteAcademicYearsDialog } from '@/components/academic-years/bulk-delete-academic-years-dialog';
import { AddTermDialog } from '@/components/academic-years/add-term-dialog';
import { EditTermDialog } from '@/components/academic-years/edit-term-dialog';
import { ViewTermDialog } from '@/components/academic-years/view-term-dialog';
import { DeleteTermDialog } from '@/components/academic-years/delete-term-dialog';
import { BulkDeleteTermsDialog } from '@/components/academic-years/bulk-delete-terms-dialog';
import { DataTable, createSortableHeader, createSelectColumn } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { exportToCSV, exportToPDF } from '../../../lib/exports';

interface AcademicYear {
  _id: Id<'academicYears'>;
  schoolId: string;
  yearCode: string;
  yearName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed' | 'archived';
  isCurrentYear: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Term {
  _id: Id<'terms'>;
  schoolId: string;
  academicYearId: Id<'academicYears'>;
  termCode: string;
  termName: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  isCurrentTerm: boolean;
  holidayStart?: string;
  holidayEnd?: string;
  description?: string;
  academicYearName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export default function AcademicYearsPage(): React.JSX.Element {
  const { user } = useAuth();
  const [showAddYearDialog, setShowAddYearDialog] = useState<boolean>(false);
  const [showAddTermDialog, setShowAddTermDialog] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [showEditYearDialog, setShowEditYearDialog] = useState<boolean>(false);
  const [showEditTermDialog, setShowEditTermDialog] = useState<boolean>(false);
  const [showViewYearDialog, setShowViewYearDialog] = useState<boolean>(false);
  const [showViewTermDialog, setShowViewTermDialog] = useState<boolean>(false);
  const [showDeleteYearDialog, setShowDeleteYearDialog] = useState<boolean>(false);
  const [showDeleteTermDialog, setShowDeleteTermDialog] = useState<boolean>(false);
  const [showBulkDeleteYearsDialog, setShowBulkDeleteYearsDialog] = useState<boolean>(false);
  const [showBulkDeleteTermsDialog, setShowBulkDeleteTermsDialog] = useState<boolean>(false);
  const [selectedYears, setSelectedYears] = useState<AcademicYear[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<Term[]>([]);
  const [yearStatusFilter, setYearStatusFilter] = useState<string>('all');
  const [termStatusFilter, setTermStatusFilter] = useState<string>('all');
  const [termYearFilter, setTermYearFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  const schoolAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const school = useQuery(
    api.schools.getBySchoolId,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const academicYears = useQuery(
    api.academicYears.getYearsBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const yearStats = useQuery(
    api.academicYears.getYearStats,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const terms = useQuery(
    api.terms.getTermsBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const termStats = useQuery(
    api.terms.getTermStats,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const setCurrentYear = useMutation(api.academicYears.setCurrentYear);
  const updateYearStatus = useMutation(api.academicYears.updateYearStatus);
  const setCurrentTerm = useMutation(api.terms.setCurrentTerm);
  const updateTermStatus = useMutation(api.terms.updateTermStatus);

  const handleSetCurrentYear = useCallback(async (yearId: Id<'academicYears'>): Promise<void> => {
    if (!schoolAdmin) return;
    try {
      await setCurrentYear({
        yearId,
        schoolId: schoolAdmin.schoolId,
        updatedBy: schoolAdmin._id,
      });
      toast.success('Current academic year updated');
    } catch (error) {
      toast.error('Failed to update current year');
      console.error(error);
    }
  }, [schoolAdmin, setCurrentYear]);

  const handleYearStatusChange = useCallback(async (
    yearId: Id<'academicYears'>,
    newStatus: 'active' | 'upcoming' | 'completed' | 'archived'
  ): Promise<void> => {
    if (!schoolAdmin) return;
    try {
      await updateYearStatus({
        yearId,
        status: newStatus,
        updatedBy: schoolAdmin._id,
      });
      toast.success(`Year status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update year status');
      console.error(error);
    }
  }, [schoolAdmin, updateYearStatus]);

  const handleSetCurrentTerm = useCallback(async (termId: Id<'terms'>): Promise<void> => {
    if (!schoolAdmin) return;
    try {
      await setCurrentTerm({
        termId,
        schoolId: schoolAdmin.schoolId,
        updatedBy: schoolAdmin._id,
      });
      toast.success('Current term updated');
    } catch (error) {
      toast.error('Failed to update current term');
      console.error(error);
    }
  }, [schoolAdmin, setCurrentTerm]);

  const handleTermStatusChange = useCallback(async (
    termId: Id<'terms'>,
    newStatus: 'active' | 'upcoming' | 'completed'
  ): Promise<void> => {
    if (!schoolAdmin) return;
    try {
      await updateTermStatus({
        termId,
        status: newStatus,
        updatedBy: schoolAdmin._id,
      });
      toast.success(`Term status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update term status');
      console.error(error);
    }
  }, [schoolAdmin, updateTermStatus]);

  const getYearStatusBadge = useCallback((status: string): React.JSX.Element => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Completed</Badge>;
      case 'archived':
        return <Badge className="bg-yellow-500">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }, []);

  const getTermStatusBadge = useCallback((status: string): React.JSX.Element => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }, []);

  const handleExportYears = useCallback((yearsToExport: AcademicYear[], format: 'csv' | 'pdf'): void => {
    const exportData = yearsToExport.map(year => ({
      yearCode: year.yearCode,
      yearName: year.yearName,
      startDate: year.startDate,
      endDate: year.endDate,
      status: year.status,
      currentYear: year.isCurrentYear ? 'Yes' : 'No',
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'academic_years');
      toast.success(`${yearsToExport.length} academic years exported as CSV`);
    } else {
      exportToPDF(exportData, 'academic_years', 'Academic Years Report');
      toast.success(`${yearsToExport.length} academic years exported as PDF`);
    }
  }, []);

  const handleExportTerms = useCallback((termsToExport: Term[], format: 'csv' | 'pdf'): void => {
    const exportData = termsToExport.map(term => ({
      termCode: term.termCode,
      termName: term.termName,
      academicYear: term.academicYearName,
      termNumber: term.termNumber,
      startDate: term.startDate,
      endDate: term.endDate,
      status: term.status,
      currentTerm: term.isCurrentTerm ? 'Yes' : 'No',
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'terms');
      toast.success(`${termsToExport.length} terms exported as CSV`);
    } else {
      exportToPDF(exportData, 'terms', 'Terms Report');
      toast.success(`${termsToExport.length} terms exported as PDF`);
    }
  }, []);

  const handleYearRowSelectionChange = useCallback((selectedRows: AcademicYear[]): void => {
    setSelectedYears(selectedRows);
  }, []);

  const handleTermRowSelectionChange = useCallback((selectedRows: Term[]): void => {
    setSelectedTerms(selectedRows);
  }, []);

  const filteredYears = useMemo(() => {
    return academicYears?.filter((year) => {
      const statusMatch = yearStatusFilter === 'all' || year.status === yearStatusFilter;
      return statusMatch;
    }) || [];
  }, [academicYears, yearStatusFilter]);

  const filteredTerms = useMemo(() => {
    return terms?.filter((term) => {
      const statusMatch = termStatusFilter === 'all' || term.status === termStatusFilter;
      const yearMatch = termYearFilter === 'all' || term.academicYearId === termYearFilter;
      return statusMatch && yearMatch;
    }) || [];
  }, [terms, termStatusFilter, termYearFilter]);

  const yearColumns: ColumnDef<AcademicYear>[] = useMemo(() => [
    createSelectColumn<AcademicYear>(),
    {
      accessorKey: 'yearCode',
      header: createSortableHeader('Year Code'),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue('yearCode')}</span>
      ),
    },
    {
      accessorKey: 'yearName',
      header: createSortableHeader('Year Name'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{row.getValue('yearName')}</span>
          {row.original.isCurrentYear && (
            <Badge className="bg-blue-500 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Current
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: createSortableHeader('Start Date'),
      cell: ({ row }) => new Date(row.getValue('startDate')).toLocaleDateString(),
    },
    {
      accessorKey: 'endDate',
      header: createSortableHeader('End Date'),
      cell: ({ row }) => new Date(row.getValue('endDate')).toLocaleDateString(),
    },
    {
      accessorKey: 'status',
      header: createSortableHeader('Status'),
      cell: ({ row }) => getYearStatusBadge(row.getValue('status')),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const year = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedYear(year);
                setShowViewYearDialog(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedYear(year);
                    setShowEditYearDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {!year.isCurrentYear && (
                  <DropdownMenuItem onClick={() => handleSetCurrentYear(year._id)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Set as Current
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleYearStatusChange(year._id, 'active')}
                  disabled={year.status === 'active'}
                >
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleYearStatusChange(year._id, 'upcoming')}
                  disabled={year.status === 'upcoming'}
                >
                  Upcoming
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleYearStatusChange(year._id, 'completed')}
                  disabled={year.status === 'completed'}
                >
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleYearStatusChange(year._id, 'archived')}
                  disabled={year.status === 'archived'}
                >
                  Archived
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedYear(year);
                    setShowDeleteYearDialog(true);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [getYearStatusBadge, handleSetCurrentYear, handleYearStatusChange]);

  const termColumns: ColumnDef<Term>[] = useMemo(() => [
    createSelectColumn<Term>(),
    {
      accessorKey: 'termCode',
      header: createSortableHeader('Term Code'),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue('termCode')}</span>
      ),
    },
    {
      accessorKey: 'termName',
      header: createSortableHeader('Term Name'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{row.getValue('termName')}</span>
          {row.original.isCurrentTerm && (
            <Badge className="bg-blue-500 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Current
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'academicYearName',
      header: createSortableHeader('Academic Year'),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue('academicYearName')}</span>
      ),
    },
    {
      accessorKey: 'termNumber',
      header: createSortableHeader('Term #'),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('termNumber')}</span>
      ),
    },
    {
      accessorKey: 'startDate',
      header: createSortableHeader('Start Date'),
      cell: ({ row }) => new Date(row.getValue('startDate')).toLocaleDateString(),
    },
    {
      accessorKey: 'endDate',
      header: createSortableHeader('End Date'),
      cell: ({ row }) => new Date(row.getValue('endDate')).toLocaleDateString(),
    },
    {
      accessorKey: 'status',
      header: createSortableHeader('Status'),
      cell: ({ row }) => getTermStatusBadge(row.getValue('status')),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const term = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTerm(term);
                setShowViewTermDialog(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTerm(term);
                    setShowEditTermDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {!term.isCurrentTerm && (
                  <DropdownMenuItem onClick={() => handleSetCurrentTerm(term._id)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Set as Current
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleTermStatusChange(term._id, 'active')}
                  disabled={term.status === 'active'}
                >
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTermStatusChange(term._id, 'upcoming')}
                  disabled={term.status === 'upcoming'}
                >
                  Upcoming
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTermStatusChange(term._id, 'completed')}
                  disabled={term.status === 'completed'}
                >
                  Completed
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTerm(term);
                    setShowDeleteTermDialog(true);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [getTermStatusBadge, handleSetCurrentTerm, handleTermStatusChange]);

  if (!user || !schoolAdmin || !school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Academic Years & Terms</h1>
          <p className="text-muted-foreground">
            Manage your school&apos;s academic calendar
          </p>
        </div>
      </div>

      <Tabs defaultValue="years" className="space-y-6">
        <TabsList>
          <TabsTrigger value="years">Academic Years</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="years" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Years</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{yearStats?.total || 0}</div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{yearStats?.active || 0}</div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{yearStats?.upcoming || 0}</div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Archive className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{yearStats?.completed || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Academic Years</CardTitle>
                    <CardDescription>
                      Manage your school&apos;s academic years
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <List className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('card')}
                    >
                      <Grid3x3 className="h-4 w-4 mr-2" />
                      Card
                    </Button>
                    <Button onClick={() => setShowAddYearDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Year
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!academicYears || academicYears.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No academic years found</h3>
                  <p className="text-muted-foreground">
                    Get started by adding your first academic year
                  </p>
                  <Button onClick={() => setShowAddYearDialog(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Academic Year
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-45">
                      <Select value={yearStatusFilter} onValueChange={setYearStatusFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {viewMode === 'table' ? (
                    <DataTable
                      columns={yearColumns}
                      data={filteredYears}
                      searchKey="yearName"
                      searchPlaceholder="Search by year name..."
                      exportFormats={['csv', 'pdf']}
                      onExport={(rows, format) => handleExportYears(rows, format as "csv" | "pdf")}
                      onSelectionChange={handleYearRowSelectionChange}
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredYears.map((year) => (
                        <Card key={year._id} className="transition-all duration-200 hover:shadow-lg cursor-pointer">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{year.yearName}</CardTitle>
                                  {year.isCurrentYear && (
                                    <Badge className="bg-blue-500 flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Current
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{year.yearCode}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedYear(year); setShowViewYearDialog(true); }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedYear(year); setShowEditYearDialog(true); }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {!year.isCurrentYear && (
                                    <DropdownMenuItem onClick={() => handleSetCurrentYear(year._id)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Set as Current
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => { setSelectedYear(year); setShowDeleteYearDialog(true); }} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Duration:</span>
                              <span className="text-sm font-medium">{new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Status:</span>
                              {getYearStatusBadge(year.status)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {selectedYears.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => setShowBulkDeleteYearsDialog(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected ({selectedYears.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{termStats?.total || 0}</div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{termStats?.active || 0}</div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{termStats?.upcoming || 0}</div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Archive className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{termStats?.completed || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Terms</CardTitle>
                    <CardDescription>
                      Manage terms for your academic years
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <List className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('card')}
                    >
                      <Grid3x3 className="h-4 w-4 mr-2" />
                      Card
                    </Button>
                    <Button onClick={() => setShowAddTermDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Term
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!terms || terms.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No terms found</h3>
                  <p className="text-muted-foreground">
                    Get started by adding your first term
                  </p>
                  <Button onClick={() => setShowAddTermDialog(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Term
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-45">
                      <Select value={termStatusFilter} onValueChange={setTermStatusFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-45">
                      <Select value={termYearFilter} onValueChange={setTermYearFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Filter by Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {academicYears?.map((year) => (
                            <SelectItem key={year._id} value={year._id}>
                              {year.yearName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {viewMode === 'table' ? (
                    <DataTable
                      columns={termColumns}
                      data={filteredTerms}
                      searchKey="termName"
                      searchPlaceholder="Search by term name..."
                      exportFormats={['csv', 'pdf']}
                      onExport={(rows, format) => handleExportTerms(rows, format as "csv" | "pdf")}
                      onSelectionChange={handleTermRowSelectionChange}
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredTerms.map((term) => (
                        <Card key={term._id} className="transition-all duration-200 hover:shadow-lg cursor-pointer">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{term.termName}</CardTitle>
                                  {term.isCurrentTerm && (
                                    <Badge className="bg-blue-500 flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Current
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{term.academicYearName}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedTerm(term); setShowViewTermDialog(true); }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedTerm(term); setShowEditTermDialog(true); }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {!term.isCurrentTerm && (
                                    <DropdownMenuItem onClick={() => handleSetCurrentTerm(term._id)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Set as Current
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => { setSelectedTerm(term); setShowDeleteTermDialog(true); }} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Term Number:</span>
                              <span className="font-medium">{term.termNumber}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Duration:</span>
                              <span className="text-sm font-medium">{new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Status:</span>
                              {getTermStatusBadge(term.status)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {selectedTerms.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => setShowBulkDeleteTermsDialog(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected ({selectedTerms.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Academic Year Dialogs */}
      <AddAcademicYearDialog
        open={showAddYearDialog}
        onOpenChange={setShowAddYearDialog}
        schoolId={schoolAdmin.schoolId}
        createdBy={schoolAdmin._id}
      />

      {selectedYear && (
        <>
          <EditAcademicYearDialog
            open={showEditYearDialog}
            onOpenChange={setShowEditYearDialog}
            academicYear={selectedYear}
            updatedBy={schoolAdmin._id}
          />

          <ViewAcademicYearDialog
            open={showViewYearDialog}
            onOpenChange={setShowViewYearDialog}
            academicYear={selectedYear}
          />

          <DeleteAcademicYearDialog
            open={showDeleteYearDialog}
            onOpenChange={setShowDeleteYearDialog}
            academicYear={selectedYear}
            deletedBy={schoolAdmin._id}
            onDeleted={() => setSelectedYear(null)}
          />
        </>
      )}

      {selectedYears.length > 0 && (
        <BulkDeleteAcademicYearsDialog
          open={showBulkDeleteYearsDialog}
          onOpenChange={setShowBulkDeleteYearsDialog}
          academicYears={selectedYears}
          deletedBy={schoolAdmin._id}
          onDeleted={() => setSelectedYears([])}
        />
      )}

      {/* Term Dialogs */}
      <AddTermDialog
        open={showAddTermDialog}
        onOpenChange={setShowAddTermDialog}
        schoolId={schoolAdmin.schoolId}
        createdBy={schoolAdmin._id}
      />

      {selectedTerm && (
        <>
          <EditTermDialog
            open={showEditTermDialog}
            onOpenChange={setShowEditTermDialog}
            term={selectedTerm}
            updatedBy={schoolAdmin._id}
          />

          <ViewTermDialog
            open={showViewTermDialog}
            onOpenChange={setShowViewTermDialog}
            term={selectedTerm}
          />

          <DeleteTermDialog
            open={showDeleteTermDialog}
            onOpenChange={setShowDeleteTermDialog}
            term={selectedTerm}
            deletedBy={schoolAdmin._id}
            onDeleted={() => setSelectedTerm(null)}
          />
        </>
      )}

      {selectedTerms.length > 0 && (
        <BulkDeleteTermsDialog
          open={showBulkDeleteTermsDialog}
          onOpenChange={setShowBulkDeleteTermsDialog}
          terms={selectedTerms}
          deletedBy={schoolAdmin._id}
          onDeleted={() => setSelectedTerms([])}
        />
      )}
    </div>
  );
}
