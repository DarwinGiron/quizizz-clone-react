import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const UserSelection = ({ selectedUsers, onSelectionChange }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleCheckboxChange = (userId) => {
    if (selectedUsers.includes(userId)) {
      onSelectionChange(selectedUsers.filter(id => id !== userId));
    } else {
      onSelectionChange([...selectedUsers, userId]);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-primary border border-border-secondary rounded-lg p-4 mt-4">
        <input 
            type="text"
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary p-2 rounded-md border border-border mb-4"
        />
        {loading ? (
            <p className="text-text-muted">Cargando usuarios...</p>
        ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {filteredUsers.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-hover cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleCheckboxChange(user.id)}
                            className="h-4 w-4 rounded bg-secondary border-border-secondary text-accent focus:ring-accent"
                        />
                        <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center font-bold text-accent text-sm">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-text-primary font-medium">{user.name || 'Usuario sin nombre'}</span>
                    </label>
                ))}
            </div>
        )}
    </div>
  );
};

export default UserSelection;
