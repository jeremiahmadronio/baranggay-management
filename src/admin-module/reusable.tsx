import { useState } from 'react';
import { ActionModal, ConfirmModal, LoadingModal, InputModal, InputGroupModal, TableFilter, Table, StatusBadge, getStatusFromValue, ActionButton, ActionButtonGroup, KPICard, KPIGrid, KPIIcons, ViewModal } from '../reusable';
import type { TableColumn, InputField, DetailSection } from '../reusable';

import { NoticeBanner } from "../reusable/Notification";

export function Reusable() {
  // Mod
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmDanger, setShowConfirmDanger] = useState(false);

  const [showLoading, setShowLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showTextarea, setShowTextarea] = useState(false);
  const [showInputGroup, setShowInputGroup] = useState(false);
  const [submittedValue, setSubmittedValue] = useState('');

  // View and Edit modal states (for table)
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  // Standalone View/Edit Demo states
  const [showStandaloneView, setShowStandaloneView] = useState(false);
  const [showStandaloneEdit, setShowStandaloneEdit] = useState(false);

  // Sample data for table demo
  // Input values (what user types/selects)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [purokFilter, setPurokFilter] = useState('');
  
  // Applied filter values (used for actual filtering)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedPurok, setAppliedPurok] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const itemsPerPage = 5;

  interface Resident {
    id: number;
    name: string;
    age: number;
    purok: string;
    status: string;
    contact: string;
  }

  // Handle view resident
  const handleViewResident = (resident: Resident) => {
    setSelectedResident(resident);
    setShowViewModal(true);
  };

  // Handle edit resident
  const handleEditResident = (resident: Resident) => {
    setSelectedResident(resident);
    setShowEditModal(true);
  };

  // Get detail sections for view modal
  const getResidentDetailSections = (resident: Resident): DetailSection[] => [
    {
      title: 'Personal Information',
      fields: [
        { key: 'id', label: 'Resident ID', value: `#${resident.id}`, width: 'half' },
        { key: 'name', label: 'Full Name', value: resident.name, width: 'half' },
        { key: 'age', label: 'Age', value: `${resident.age} years old`, width: 'half' },
        { key: 'status', label: 'Status', value: (
          <StatusBadge 
            status={getStatusFromValue(resident.status)} 
            label={resident.status.charAt(0).toUpperCase() + resident.status.slice(1)} 
          />
        ), width: 'half' }
      ]
    },
    {
      title: 'Contact & Location',
      fields: [
        { key: 'contact', label: 'Contact Number', value: resident.contact, width: 'half' },
        { key: 'purok', label: 'Purok', value: resident.purok, width: 'half' }
      ]
    }
  ];

  const sampleResidents: Resident[] = [
    { id: 1, name: 'Juan Dela Cruz', age: 35, purok: 'Purok 1', status: 'active', contact: '09171234567' },
    { id: 2, name: 'Maria Santos', age: 28, purok: 'Purok 2', status: 'active', contact: '09181234567' },
    { id: 3, name: 'Pedro Reyes', age: 45, purok: 'Purok 1', status: 'inactive', contact: '09191234567' },
    { id: 4, name: 'Ana Garcia', age: 32, purok: 'Purok 3', status: 'pending', contact: '09201234567' },
    { id: 5, name: 'Jose Rizal', age: 40, purok: 'Purok 2', status: 'active', contact: '09211234567' },
    { id: 6, name: 'Carmen Luna', age: 29, purok: 'Purok 3', status: 'inactive', contact: '09221234567' },
    { id: 7, name: 'Miguel Torres', age: 55, purok: 'Purok 1', status: 'active', contact: '09231234567' },
    { id: 8, name: 'Rosa Mendoza', age: 48, purok: 'Purok 2', status: 'pending', contact: '09241234567' },
  ];

  // Filter the data using APPLIED filter values
  const filteredResidents = sampleResidents.filter(resident => {
    const matchesSearch = resident.name.toLowerCase().includes(appliedSearch.toLowerCase()) ||
                          resident.contact.includes(appliedSearch);
    const matchesStatus = !appliedStatus || resident.status === appliedStatus;
    const matchesPurok = !appliedPurok || resident.purok === appliedPurok;
    return matchesSearch && matchesStatus && matchesPurok;
  });

  // Pagination logic
  const totalItems = filteredResidents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = filteredResidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle filter button click - apply the filter values
  const handleFilter = () => {
    setAppliedSearch(searchTerm);
    setAppliedStatus(statusFilter);
    setAppliedPurok(purokFilter);
    setCurrentPage(1); // Reset to first page on new filter
  };

  // Handle clear button click
  const handleClear = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPurokFilter('');
    setAppliedSearch('');
    setAppliedStatus('');
    setAppliedPurok('');
    setCurrentPage(1);
  };

  // Table columns configuration
  const columns: TableColumn<Resident>[] = [
    { key: 'id', header: 'ID', width: '60px', align: 'center' },
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', width: '80px', align: 'center' },
    { key: 'purok', header: 'Purok' },
    { key: 'contact', header: 'Contact' },
    { 
      key: 'status', 
      header: 'Status', 
      align: 'center',
      render: (item) => (
        <StatusBadge 
          status={getStatusFromValue(item.status)} 
          label={item.status.charAt(0).toUpperCase() + item.status.slice(1)} 
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (item) => (
        <ActionButtonGroup>
          <ActionButton type="view" onClick={() => handleViewResident(item)} />
          <ActionButton type="edit" onClick={() => handleEditResident(item)} />
          <ActionButton type="delete" onClick={() => alert(`Delete ${item.name}`)} />
        </ActionButtonGroup>
      )
    }
  ];

  // InputGroupModal fields configuration
  const residentFields: InputField[] = [
    { key: 'firstName', label: 'First Name', required: true, width: 'half', placeholder: 'Juan' },
    { key: 'lastName', label: 'Last Name', required: true, width: 'half', placeholder: 'Dela Cruz' },
    { key: 'middleName', label: 'Middle Name', width: 'half', placeholder: 'Santos' },
    { key: 'suffix', label: 'Suffix', width: 'half', placeholder: 'Jr., Sr., III' },
    { key: 'birthDate', label: 'Birth Date', type: 'date', required: true, width: 'half' },
    { key: 'gender', label: 'Gender', type: 'select', required: true, width: 'half', options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' }
    ]},
    { key: 'contact', label: 'Contact Number', type: 'tel', required: true, width: 'half', placeholder: '09171234567' },
    { key: 'email', label: 'Email Address', type: 'email', width: 'half', placeholder: 'juan@email.com' },
    { key: 'purok', label: 'Purok', type: 'select', required: true, width: 'half', options: [
      { value: 'Purok 1', label: 'Purok 1' },
      { value: 'Purok 2', label: 'Purok 2' },
      { value: 'Purok 3', label: 'Purok 3' }
    ]},
    { key: 'civilStatus', label: 'Civil Status', type: 'select', required: true, width: 'half', options: [
      { value: 'single', label: 'Single' },
      { value: 'married', label: 'Married' },
      { value: 'widowed', label: 'Widowed' },
      { value: 'separated', label: 'Separated' }
    ]},
    { key: 'address', label: 'Complete Address', type: 'textarea', required: true, placeholder: 'House No., Street, Barangay, City' }
  ];

  // Edit fields for table resident (simpler version)
  const editResidentFields: InputField[] = [
    { key: 'name', label: 'Full Name', required: true, placeholder: 'Juan Dela Cruz' },
    { key: 'age', label: 'Age', type: 'number', required: true, width: 'half', placeholder: '35' },
    { key: 'contact', label: 'Contact Number', type: 'tel', required: true, width: 'half', placeholder: '09171234567' },
    { key: 'purok', label: 'Purok', type: 'select', required: true, width: 'half', options: [
      { value: 'Purok 1', label: 'Purok 1' },
      { value: 'Purok 2', label: 'Purok 2' },
      { value: 'Purok 3', label: 'Purok 3' }
    ]},
    { key: 'status', label: 'Status', type: 'select', required: true, width: 'half', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Pending' }
    ]}
  ];

  const handleConfirm = () => {
    alert('Confirmed!');
    setShowConfirm(false);
  };

  const handleDelete = () => {
    alert('Deleted!');
    setShowConfirmDanger(false);
  };

  const simulateLoading = () => {
    setShowLoading(true);
    setTimeout(() => setShowLoading(false), 3000);
  };

  const handleInputSubmit = (value: string) => {
    setSubmittedValue(value);
    setShowInput(false);
    setShowSuccess(true);
  };

  const handleTextareaSubmit = (value: string) => {
    setSubmittedValue(value);
    setShowTextarea(false);
    setShowSuccess(true);
  };

  return (
    <div className="p-4 md:p-8 w-full">
      {/* Notification Banner at the top */}
      <div className="mb-4">
        <NoticeBanner
          title="Privacy Notice:"
          message="In compliance with RA 9262 (Anti-VAWC Act) and the Data Privacy Act of 2012, all records display victim initials only. Full details are accessible only to authorized personnel."
          variant="info"
        />
      </div>
      <h1 className="text-2xl font-bold mb-4">Reusable Components Testing</h1>
      
      {/* Action Modals */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Action Modals</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowSuccess(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Success Modal
          </button>
          <button
            onClick={() => setShowDanger(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            Danger Modal
          </button>
          <button
            onClick={() => setShowInfo(true)}
            className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition"
          >
            Info Modal
          </button>
        </div>
      </section>

      {/* Confirm Modals */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Confirm Modals</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Confirm Action
          </button>
          <button
            onClick={() => setShowConfirmDanger(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            Delete Confirmation
          </button>
        </div>
      </section>

      {/* Loading Modal */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Loading Modal</h2>
        <button
          onClick={simulateLoading}
          className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
        >
          Show Loading (3s)
        </button>
      </section>

      {/* Input Modals */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Input Modals</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowInput(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Text Input Modal
          </button>
          <button
            onClick={() => setShowTextarea(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Textarea Modal
          </button>
          <button
            onClick={() => setShowInputGroup(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
          >
            Add Resident (Input Group)
          </button>
        </div>
        {submittedValue && (
          <p className="mt-3 p-3 bg-gray-100 rounded-md text-gray-700">
            Last submitted value: <strong>{submittedValue}</strong>
          </p>
        )}
      </section>

      {/* KPI Cards Demo Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">KPI Cards</h2>
        <KPIGrid columns={4}>
          <KPICard
            title="Total Residents"
            value="1,234"
            icon={KPIIcons.users}
            color="blue"
            trend={{ value: "+12%", direction: "up", label: "vs last month" }}
          />
          <KPICard
            title="Active Households"
            value="456"
            icon={KPIIcons.home}
            color="emerald"
            trend={{ value: "+5%", direction: "up", label: "vs last month" }}
          />
          <KPICard
            title="Pending Requests"
            value="23"
            icon={KPIIcons.clock}
            color="amber"
            trend={{ value: "-8%", direction: "down", label: "vs last week" }}
          />
          <KPICard
            title="Documents Issued"
            value="89"
            icon={KPIIcons.document}
            color="violet"
            subtitle="This month"
          />
        </KPIGrid>
      </section>

      {/* View & Edit Components Demo Section - STANDALONE */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">View & Edit Components</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowStandaloneView(true)}
            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition text-sm"
          >
            View Resident Info
          </button>
          <button
            onClick={() => setShowStandaloneEdit(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
          >
            Edit Resident Info
          </button>
        </div>
      </section>

      {/* Table Demo Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Table with Filter & Status Badge</h2>
        
        {/* Status Badge Demo */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Status Badges:</h3>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="success" label="Active" />
            <StatusBadge status="danger" label="Inactive" />
            <StatusBadge status="pending" label="Pending" />
            <StatusBadge status="warning" label="Processing" />
            <StatusBadge status="info" label="New" />
            <StatusBadge status="default" label="Draft" />
          </div>
        </div>

        {/* Action Button Demo */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Action Links:</h3>
          <div className="flex flex-wrap gap-4">
            <ActionButton type="view" onClick={() => alert('View')} />
            <ActionButton type="edit" onClick={() => alert('Edit')} />
            <ActionButton type="delete" onClick={() => alert('Delete')} />
            <ActionButton type="approve" onClick={() => alert('Approve')} />
            <ActionButton type="print" onClick={() => alert('Print')} />
          </div>
        </div>

        {/* Table Filter */}
        <TableFilter
          searchPlaceholder="Search by name or contact..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            {
              label: 'Status',
              key: 'status',
              value: statusFilter,
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' }
              ]
            },
            {
              label: 'Purok',
              key: 'purok',
              value: purokFilter,
              options: [
                { value: 'Purok 1', label: 'Purok 1' },
                { value: 'Purok 2', label: 'Purok 2' },
                { value: 'Purok 3', label: 'Purok 3' }
              ]
            }
          ]}
          onFilterChange={(key, value) => {
            if (key === 'status') setStatusFilter(value);
            if (key === 'purok') setPurokFilter(value);
          }}
          onFilterClick={handleFilter}
          onClearClick={handleClear}
        />

        {/* Table */}
        <Table
          columns={columns}
          data={paginatedData}
          keyExtractor={(item) => item.id}
          emptyMessage="No residents found matching your filters"
          minRows={itemsPerPage}
          selectable
          selectedKeys={selectedIds}
          onSelectionChange={setSelectedIds}
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            onPageChange: setCurrentPage
          }}
        />
      </section>

      {/* Action Modals */}
      <ActionModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Success!"
        type="success"
      >
        <p>Your action was completed successfully.</p>
      </ActionModal>

      <ActionModal
        isOpen={showDanger}
        onClose={() => setShowDanger(false)}
        title="Error Occurred"
        type="danger"
      >
        <p>Something went wrong. Please try again.</p>
      </ActionModal>

      <ActionModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Information"
        type="info"
      >
        <p>This is an informational message for the user.</p>
      </ActionModal>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={showConfirm}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        title="Confirm Action"
        message="Are you sure you want to proceed with this action?"
        type="info"
      />

      <ConfirmModal
        isOpen={showConfirmDanger}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDanger(false)}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      {/* Loading Modal */}
      <LoadingModal isOpen={showLoading} message="Processing your request..." />

      {/* Input Modals */}
      <InputModal
        isOpen={showInput}
        onSubmit={handleInputSubmit}
        onCancel={() => setShowInput(false)}
        title="Enter Your Name"
        label="Full Name"
        placeholder="Juan Dela Cruz"
      />

      <InputModal
        isOpen={showTextarea}
        onSubmit={handleTextareaSubmit}
        onCancel={() => setShowTextarea(false)}
        title="Leave a Message"
        label="Your Message"
        placeholder="Type your message here..."
        inputType="textarea"
        submitText="Send"
      />

      <InputGroupModal
        isOpen={showInputGroup}
        onSubmit={(values) => {
          console.log('Resident Data:', values);
          alert(`Resident Added:\n${JSON.stringify(values, null, 2)}`);
          setShowInputGroup(false);
        }}
        onCancel={() => setShowInputGroup(false)}
        title="Add New Resident"
        fields={residentFields}
        submitText="Add Resident"
        size="lg"
      />

      {/* View Resident Modal (from table) */}
      {selectedResident && (
        <ViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedResident(null);
          }}
          title={selectedResident.name}
          subtitle={`Resident ID: #${selectedResident.id}`}
          avatar={{ name: selectedResident.name }}
          sections={getResidentDetailSections(selectedResident)}
          size="xl"
          onEdit={() => {
            setShowViewModal(false);
            setShowEditModal(true);
          }}
        />
      )}

      {/* Edit Resident Modal (from table) */}
      {selectedResident && (
        <InputGroupModal
          isOpen={showEditModal}
          onSubmit={(values) => {
            console.log('Updated Resident:', { id: selectedResident.id, ...values });
            alert(`Resident Updated:\n${JSON.stringify({ id: selectedResident.id, ...values }, null, 2)}`);
            setShowEditModal(false);
            setSelectedResident(null);
          }}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedResident(null);
          }}
          title={`Edit Resident: ${selectedResident.name}`}
          fields={editResidentFields}
          initialValues={{
            name: selectedResident.name,
            age: String(selectedResident.age),
            contact: selectedResident.contact,
            purok: selectedResident.purok,
            status: selectedResident.status
          }}
          submitText="Save Changes"
          size="md"
        />
      )}

      {/* STANDALONE View Modal - NOT connected to table */}
      <ViewModal
        isOpen={showStandaloneView}
        onClose={() => setShowStandaloneView(false)}
        title="Juan Dela Cruz"
        subtitle="Resident ID: #1001"
        avatar={{ name: 'Juan Dela Cruz' }}
        sections={[
          {
            title: 'Personal Information',
            fields: [
              { key: 'fullName', label: 'Full Name', value: 'Juan Dela Cruz' },
              { key: 'age', label: 'Age', value: '35 years old' },
              { key: 'birthDate', label: 'Birth Date', value: 'January 15, 1989' },
              { key: 'gender', label: 'Gender', value: 'Male' },
              { key: 'civilStatus', label: 'Civil Status', value: 'Married' },
              { key: 'nationality', label: 'Nationality', value: 'Filipino' }
            ]
          },
          {
            title: 'Contact & Address',
            fields: [
              { key: 'contact', label: 'Contact Number', value: '0917-123-4567' },
              { key: 'email', label: 'Email Address', value: 'juan.delacruz@email.com' },
              { key: 'purok', label: 'Purok', value: 'Purok 1' },
              { key: 'address', label: 'Complete Address', value: '123 Mabini St., Barangay San Jose, Manila City', width: 'full' }
            ]
          },
          {
            title: 'Status',
            fields: [
              { key: 'status', label: 'Residency Status', value: <StatusBadge status="success" label="Active" /> },
              { key: 'registrationDate', label: 'Registration Date', value: 'March 10, 2023' }
            ]
          }
        ]}
        size="xl"
        onEdit={() => {
          setShowStandaloneView(false);
          setShowStandaloneEdit(true);
        }}
      />

      {/* STANDALONE Edit Modal - NOT connected to table */}
      <InputGroupModal
        isOpen={showStandaloneEdit}
        onSubmit={(values) => {
          console.log('Standalone Edit Values:', values);
          alert(`Saved Changes:\n${JSON.stringify(values, null, 2)}`);
          setShowStandaloneEdit(false);
        }}
        onCancel={() => setShowStandaloneEdit(false)}
        title="Edit Resident Information"
        fields={[
          { key: 'firstName', label: 'First Name', required: true, width: 'half', placeholder: 'Juan' },
          { key: 'lastName', label: 'Last Name', required: true, width: 'half', placeholder: 'Dela Cruz' },
          { key: 'middleName', label: 'Middle Name', width: 'half', placeholder: 'Santos' },
          { key: 'suffix', label: 'Suffix', width: 'half', placeholder: 'Jr., Sr., III' },
          { key: 'birthDate', label: 'Birth Date', type: 'date', required: true, width: 'half' },
          { key: 'gender', label: 'Gender', type: 'select', required: true, width: 'half', options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
          ]},
          { key: 'contact', label: 'Contact Number', type: 'tel', required: true, width: 'half', placeholder: '09171234567' },
          { key: 'email', label: 'Email Address', type: 'email', width: 'half', placeholder: 'juan@email.com' },
          { key: 'purok', label: 'Purok', type: 'select', required: true, width: 'half', options: [
            { value: 'Purok 1', label: 'Purok 1' },
            { value: 'Purok 2', label: 'Purok 2' },
            { value: 'Purok 3', label: 'Purok 3' }
          ]},
          { key: 'civilStatus', label: 'Civil Status', type: 'select', required: true, width: 'half', options: [
            { value: 'single', label: 'Single' },
            { value: 'married', label: 'Married' },
            { value: 'widowed', label: 'Widowed' },
            { value: 'separated', label: 'Separated' }
          ]},
          { key: 'address', label: 'Complete Address', type: 'textarea', required: true, placeholder: 'House No., Street, Barangay, City' }
        ]}
        initialValues={{
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          middleName: 'Santos',
          suffix: '',
          birthDate: '1989-01-15',
          gender: 'male',
          contact: '09171234567',
          email: 'juan.delacruz@email.com',
          purok: 'Purok 1',
          civilStatus: 'married',
          address: '123 Mabini St., Barangay San Jose, Manila City'
        }}
        submitText="Save Changes"
        size="lg"
      />
    </div>
  );
}