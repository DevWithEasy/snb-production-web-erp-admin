"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Firebase from "@/utils/firebase";
import AddUserModal from "@/components/users/AddUserModal";

export default function Users() {
  const [sections, setSections] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const router = useRouter();

  // Form fields state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [section, setSection] = useState("");

  // Track last tap for double tap detection
  const [lastTap, setLastTap] = useState(null);

  const fetchSections = async () => {
    try {
      const fetchSections = await Firebase.getDocuments("sections");
      const sorted = fetchSections.sort((a, b) =>
        a.label.localeCompare(b.label)
      );
      setSections(sorted);
      if (!section && sorted.length > 0) {
        setSection(sorted[0].value);
      }
    } catch (error) {
      console.error("Failed to load sections:", error);
      alert("Failed to load sections");
    }
  };

  const getUsers = async () => {
    try {
      setUsersLoading(true);
      const usersData = await Firebase.getDocuments("users");
      if (usersData && usersData.length > 0) {
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
    fetchSections();
  }, []);

  // Handle double tap
  const handleDoubleTap = (user) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
      // Double tap detected - open edit modal
      openEditModal(user);
      setLastTap(null);
    } else {
      setLastTap(now);
    }
  };

  // Handle long press
  const handleLongPress = (user) => {
    openDeleteConfirm(user);
  };

  // Open edit modal
  const openEditModal = (user) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password);
    setRole(user.role);
    setSection(user.section);
    setEditModalVisible(true);
  };

  // Close edit modal and reset form
  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingUser(null);
    setName("");
    setUsername("");
    setPassword("");
    setRole("user");
    setSection("");
  };

  const updateUser = async () => {
    try {
      const updatedUser = {
        ...editingUser,
        name,
        username,
        password,
        role,
        section,
      };

      await Firebase.updateDocument("users", editingUser.id, updatedUser);
      closeEditModal();
      getUsers();
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  // Open add modal
  const openAddModal = () => {
    setAddModalVisible(true);
  };

  // Close add modal and reset form
  const closeAddModal = () => {
    setAddModalVisible(false);
    setName("");
    setUsername("");
    setPassword("");
    setRole("user");
    setSection(sections.length > 0 ? sections[0].value : "");
  };

  // Open delete confirmation
  const openDeleteConfirm = (user) => {
    setDeletingUser(user);
    setDeleteConfirmVisible(true);
  };

  // Close delete confirmation
  const closeDeleteConfirm = () => {
    setDeleteConfirmVisible(false);
    setDeletingUser(null);
  };

  // Delete user from Firebase
  const deleteUser = async () => {
    try {
      await Firebase.deleteDocument("users", deletingUser.id);
      alert("Success: User deleted successfully");
      closeDeleteConfirm();
      getUsers(); // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error: Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>

        {/* Hint Text */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-6">
          <p className="text-blue-700 text-sm">
            💡 Double click on a user to edit • Right click to delete
          </p>
        </div>

        {/* Users List */}
        {usersLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : users.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Users ({users.length})
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {users.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleDoubleTap(item)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleLongPress(item);
                  }}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200 last:border-b-0"
                >
                  <div className="font-medium text-gray-800 mb-2">{item.name}</div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Username: {item.username}</div>
                    <div>Password: {item.password}</div>
                    <div>
                      Role: {item.role.charAt(0).toUpperCase() + item.role.slice(1)} | 
                      Section: {item.section.charAt(0).toUpperCase() + item.section.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
            No users found
          </div>
        )}

        {/* Edit User Modal */}
        {editModalVisible && (
          <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-scrollbar]:hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {sections.map((sectionItem) => (
                      <option key={sectionItem.value} value={sectionItem.value}>
                        {sectionItem.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeEditModal}
                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateUser}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {addModalVisible && (
          <AddUserModal
            sections={sections}
            onClose={closeAddModal}
            onUserAdded={() => {
              closeAddModal();
              getUsers();
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmVisible && (
          <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Delete User</h2>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-6 text-center">
                  Are you sure you want to delete <strong>{deletingUser?.name}</strong>? 
                  This action cannot be undone.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={closeDeleteConfirm}
                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteUser}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}