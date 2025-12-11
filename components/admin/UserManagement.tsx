
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserDocument } from '../../types';
import Card from '../Card';
import ScrollableListContainer from '../common/ScrollableListContainer';
import { apiService } from '../../services/apiService';
import {
  SearchIcon,
  FunnelIcon,
  UserCircleIcon,
  CheckCircleIcon,
  BanIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PencilIcon,
  ShieldCheckIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '../icons/Icons';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedUserDocs, setSelectedUserDocs] = useState<UserDocument[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [fetchedUsers, fetchedDocs] = await Promise.all([
          apiService.getUsers(),
          apiService.getUserDocuments()
        ]);
        setUsers(fetchedUsers);
        setDocuments(fetchedDocs);
      } catch (err) {
        setError("Failed to fetch data. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(filter.toLowerCase()) ||
      user.email.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter ? user.account_status === statusFilter : true;
    const matchesRegion = regionFilter ? user.region === regionFilter : true;
    const matchesGender = genderFilter ? user.gender === genderFilter : true;
    const matchesAge = ageFilter ? user.age?.toString() === ageFilter : true;

    return matchesSearch && matchesStatus && matchesRegion && matchesGender && matchesAge;
  });

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      const updatedUser = await apiService.updateUserRole(userId, newRole);
      setUsers(users.map(user => user.id === userId ? updatedUser : user));
    } catch (err) {
      alert("Failed to update user role.");
      console.error(err);
    }
  };

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState<{ userId: number, status: string } | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const initiateStatusChange = (userId: number, newStatus: string) => {
    setStatusAction({ userId, status: newStatus });
    setStatusReason('');
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!statusAction) return;

    try {
      // @ts-ignore
      await apiService.updateUserStatus(statusAction.userId, statusAction.status, statusReason);

      // Optimistic update
      setUsers(users.map(user => user.id === statusAction.userId ? {
        ...user,
        account_status: statusAction.status as any,
        is_active: true // Always keep active so they can see notifications
      } : user));

      setShowStatusModal(false);
      setStatusAction(null);
    } catch (err) {
      alert("Failed to update user status.");
      console.error(err);
    }
  };

  const handleViewDocuments = (user: User) => {
    const userDocs = documents.filter(doc => doc.user === user.id);
    setSelectedUserDocs(userDocs);
    setSelectedUser(user);
    setShowDocsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              User Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage accounts, roles, and verification status</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
            <UserCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{filteredUsers.length} Users Found</span>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="Search users..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
            />
            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Active">Active</option>
            <option value="Rejected">Rejected</option>
            <option value="Suspended">Suspended</option>
          </select>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white cursor-pointer"
          >
            <option value="">All Regions</option>
            <option value="Addis Ababa">Addis Ababa</option>
            <option value="Oromia">Oromia</option>
            <option value="Amhara">Amhara</option>
            <option value="Tigray">Tigray</option>
            <option value="Somali">Somali</option>
            <option value="Afar">Afar</option>
            <option value="SNNPR">SNNPR</option>
            <option value="Sidama">Sidama</option>
            <option value="Benishangul-Gumuz">Benishangul-Gumuz</option>
            <option value="Gambella">Gambella</option>
            <option value="Harari">Harari</option>
            <option value="South West Ethiopia Peoples">South West Ethiopia</option>
            <option value="Central Ethiopia">Central Ethiopia</option>
            <option value="Dire Dawa">Dire Dawa</option>
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white cursor-pointer"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <ScrollableListContainer>
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading user database...</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-4 p-6 bg-red-50 dark:bg-red-900/10 rounded-xl m-6 border border-red-100 dark:border-red-900/30">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h3 className="text-red-800 dark:text-red-400 font-semibold">Error Loading Data</h3>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-gray-900/50 dark:text-gray-300">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold rounded-tl-xl">User Profile</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Role</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Details</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {user.first_name ? user.first_name[0] : user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                          {user.student_identification_number && (
                            <div className="text-[10px] items-center gap-1 inline-flex mt-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                              ID: {user.student_identification_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors py-1"
                      >
                        <option>Admin</option>
                        <option>Teacher</option>
                        <option>Student</option>
                        <option>Parent</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">Region:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{user.region || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">Gender:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{user.gender || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full inline-flex items-center gap-1.5
                            ${user.account_status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          user.account_status === 'Pending Review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            user.account_status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {user.account_status === 'Active' && <CheckCircleIcon className="w-3 h-3" />}
                        {user.account_status === 'Pending Review' && <ExclamationTriangleIcon className="w-3 h-3" />}
                        {user.account_status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-60 group-hover:opacity-100 transition-all">
                        {user.account_status !== 'Active' && (
                          <button
                            onClick={() => initiateStatusChange(user.id, 'Active')}
                            className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded-lg transition-colors tooltip top" title="Activate"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}

                        {(user.account_status === 'Pending Review' || user.account_status === 'Incomplete' || user.account_status === 'Active') && (
                          <button
                            onClick={() => initiateStatusChange(user.id, 'Rejected')}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors" title="Reject"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => initiateStatusChange(user.id, 'Pending Review')}
                          className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 rounded-lg transition-colors" title="Set to Review"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>

                        {documents.some(doc => doc.user === user.id) && (
                          <button
                            onClick={() => handleViewDocuments(user)}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors ml-1" title="View Documents"
                          >
                            <DocumentTextIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollableListContainer>
      </div>

      {/* Documents Modal */}
      {showDocsModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 transform transition-all scale-100 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Uploaded Documents</h2>
                <p className="text-sm text-gray-500">Reviewing files for <span className="font-semibold text-blue-600">{selectedUser.username}</span></p>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {selectedUserDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-gray-500">No documents found for this user.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {selectedUserDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-blue-500">
                        <DocumentTextIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{doc.document_type}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a
                      href={doc.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 hover:text-blue-700 text-sm font-semibold rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow transition-all whitespace-nowrap"
                    >
                      View File
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowDocsModal(false)}
                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Close Review
              </button>
              {selectedUser.account_status !== 'Active' && (
                <button
                  onClick={() => {
                    initiateStatusChange(selectedUser.id, 'Active');
                    setShowDocsModal(false);
                  }}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Approve User
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && statusAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {statusAction.status === 'Active' ? 'Activate Account' :
                statusAction.status === 'Rejected' ? 'Reject Application' :
                  'Update Status'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to change this user's status to <span className="font-bold text-gray-900 dark:text-white">{statusAction.status}</span>?
              This will update their access permissions immediately.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reason (Optional)</label>
              <textarea
                className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                rows={3}
                placeholder="Add a note about this change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`px-5 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2
                  ${statusAction.status === 'Active' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' :
                    statusAction.status === 'Rejected' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' :
                      'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
              >
                {statusAction.status === 'Active' && <CheckCircleIcon className="w-5 h-5" />}
                {statusAction.status === 'Rejected' && <BanIcon className="w-5 h-5" />}
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;