import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import { ToastContainer } from "react-toastify";
import {
  FiTrash2,
  FiEdit,
  FiPlus,
  FiSave,
  FiX,
  FiLoader,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-toastify";

const Settings = () => {
  const {
    currentUser,
    register,
    logout,
    getAllUsers,
    updateUserRole,
    deleteUser,
  } = useAuth();

  const [adminUsers, setAdminUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newUser, setNewUser] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Admin",
  });

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const users = await getAllUsers();
        setAdminUsers(users);
      } catch (error) {
        toast.error("Failed to fetch users");
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [getAllUsers]);

  const handleAddUser = async () => {
    const { fullName, phone, email, password, confirmPassword, role } = newUser;

    if (!fullName || !phone || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsProcessing(true);
      await register(fullName, phone, email, password, role);

      // Refresh the users list
      const users = await getAllUsers();
      setAdminUsers(users);

      setNewUser({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "Admin",
      });
      setIsAdding(false);
      toast.success("User added successfully");
    } catch (error) {
      console.error("Registration error:", error.message);
      toast.error("Registration failed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setIsProcessing(true);
      await updateUserRole(userId, newRole);

      // Update local state
      setAdminUsers(
        adminUsers.map((user) =>
          user.uid === userId ? { ...user, role: newRole } : user
        )
      );
      setEditingUserId(null);
      toast.success("Role updated successfully");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setIsProcessing(true);
      await deleteUser(userId);

      // Update local state
      setAdminUsers(adminUsers.filter((user) => user.uid !== userId));
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-6 text-white">
      <ToastContainer position="bottom-right" />
      <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">Admin Management</h2>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Admin Users</h3>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center px-4 py-2 space-x-2 bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors"
              disabled={isProcessing}
            >
              <FiPlus />
              <span>Add Admin</span>
            </button>
          </div>

          {isAdding && (
            <div className="p-4 mb-6 bg-gray-700 rounded-lg shadow-md">
              <h4 className="mb-4 font-medium text-lg">Add New Admin</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="px-4 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={newUser.fullName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, fullName: e.target.value })
                  }
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  className="px-4 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="px-4 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="px-4 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="px-4 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={newUser.confirmPassword}
                  onChange={(e) =>
                    setNewUser({ ...newUser, confirmPassword: e.target.value })
                  }
                />
                <select
                  className="px-4 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Technical Admin">Technical Admin</option>
                </select>
              </div>
              <div className="flex justify-end mt-4 space-x-3">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex items-center px-4 py-2 space-x-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors"
                  disabled={isProcessing}
                >
                  <FiX />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleAddUser}
                  className="flex items-center px-4 py-2 space-x-2 bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiSave />
                  )}
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* User Table */}
          <div className="overflow-hidden border border-gray-700 rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <FiLoader className="animate-spin text-cyan-500 text-2xl" />
                      </div>
                    </td>
                  </tr>
                ) : adminUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-400"
                    >
                      No admin users found
                    </td>
                  </tr>
                ) : (
                  adminUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-750">
                      <td className="px-6 py-4 text-sm text-gray-200">
                        {user.fullName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200">
                        {editingUserId === user.uid ? (
                          <select
                            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded-md"
                            value={user.role}
                            onChange={(e) =>
                              handleUpdateRole(user.uid, e.target.value)
                            }
                          >
                            <option value="Admin">Admin</option>
                            <option value="Super Admin">Super Admin</option>
                            <option value="Technical Admin">
                              Technical Admin
                            </option>
                          </select>
                        ) : (
                          user.role
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {editingUserId === user.uid ? (
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                            disabled={isProcessing}
                          >
                            <FiX />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingUserId(user.uid)}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            disabled={isProcessing}
                          >
                            <FiEdit />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          disabled={
                            isProcessing || user.uid === currentUser?.uid
                          }
                          title={
                            user.uid === currentUser?.uid
                              ? "Cannot delete your own account"
                              : ""
                          }
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
