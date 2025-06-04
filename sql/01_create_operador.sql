CREATE TABLE IF NOT EXISTS Operador (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER,
  name TEXT,
  last_name TEXT,
  username TEXT,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  profile INTEGER,
  created_at TIMESTAMP
); 