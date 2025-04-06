import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('test123')
        .select('*');

      if (error) {
        console.error('Supabase error:', error.message);
      } else {
        console.log('Supabase data:', data);
        setUsers(data);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Supabase Test</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <strong>{user.name}</strong> - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
// This is a simple React component that fetches data from a Supabase table and logs it to the console.
//