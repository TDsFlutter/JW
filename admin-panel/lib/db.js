import mysql from 'mysql2/promise';

let pool;

export function getDbPool() {
  if (!pool) {
    const host = process.env.MYSQL_HOST || 'localhost';
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || 'ella_jewelry';
    const port = parseInt(process.env.MYSQL_PORT || '3306', 10);

    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return pool;
}

export async function query(sql, params) {
  const dbPool = getDbPool();
  try {
    const [results] = await dbPool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('MySQL Query Execution Error:', error);
    throw error;
  }
}
