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
  FiShield
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
    <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-850 min-h-screen">
      <ToastContainer position="bottom-right" theme="dark" />
      
      <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center">
            <FiShield className="mr-3 text-cyan-400" />
            Admin Management
          </h2>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-300">Admin Users</h3>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center px-4 py-2.5 space-x-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors border border-cyan-500"
              disabled={isProcessing}
            >
              <FiPlus />
              <span>Add Admin</span>
            </button>
          </div>

          {isAdding && (
            <div className="p-6 mb-6 bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 shadow-md">
              <h4 className="mb-4 font-medium text-lg text-gray-300 flex items-center">
                <FiUser className="mr-2 text-cyan-400" />
                Add New Admin
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
                    value={newUser.fullName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, fullName: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Phone</label>
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
                    value={newUser.phone}
                    onChange={(e) =>
                      setNewUser({ ...newUser, phone: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
                    value={newUser.confirmPassword}
                    onChange={(e) =>
                      setNewUser({ ...newUser, confirmPassword: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Role</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
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
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex items-center px-4 py-2.5 space-x-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-gray-600"
                  disabled={isProcessing}
                >
                  <FiX />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleAddUser}
                  className="flex items-center px-4 py-2.5 space-x-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors border border-green-500"
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
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">
                    Role
                  </th>
                  <th className="px-6 py-4 text-right text-gray-300 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <FiLoader className="animate-spin text-cyan-500 text-2xl" />
                      </div>
                    </td>
                  </tr>
                ) : adminUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      No admin users found
                    </td>
                  </tr>
                ) : (
                  adminUsers.map((user) => (
                    <tr 
                      key={user.uid} 
                      className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-200">
                        <div className="flex items-center">
                          <FiUser className="mr-2 text-cyan-400" />
                          {user.fullName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-200">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 text-gray-200">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        {editingUserId === user.uid ? (
                          <select
                            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
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
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {editingUserId === user.uid ? (
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-gray-600"
                            disabled={isProcessing}
                          >
                            <FiX className="text-gray-300" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingUserId(user.uid)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors border border-blue-500/30"
                            disabled={isProcessing}
                          >
                            <FiEdit className="text-blue-400" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/30"
                          disabled={
                            isProcessing || user.uid === currentUser?.uid
                          }
                          title={
                            user.uid === currentUser?.uid
                              ? "Cannot delete your own account"
                              : ""
                          }
                        >
                          <FiTrash2 className="text-red-400" />
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