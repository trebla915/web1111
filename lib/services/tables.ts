import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

interface Table {
  id: string;
  name: string;
  capacity: number;
  price: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION_NAME = 'tables';

export const createTable = async (tableData: Omit<Table, 'id'>): Promise<Table> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...tableData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return {
      id: docRef.id,
      ...tableData,
    };
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
};

export const updateTable = async (id: string, tableData: Partial<Table>): Promise<void> => {
  try {
    const tableRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(tableRef, {
      ...tableData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating table:', error);
    throw error;
  }
};

export const deleteTable = async (id: string): Promise<void> => {
  try {
    const tableRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(tableRef);
  } catch (error) {
    console.error('Error deleting table:', error);
    throw error;
  }
};

export const getTable = async (id: string): Promise<Table | null> => {
  try {
    const tableRef = doc(db, COLLECTION_NAME, id);
    const tableDoc = await getDoc(tableRef);
    
    if (tableDoc.exists()) {
      return {
        id: tableDoc.id,
        ...tableDoc.data(),
      } as Table;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting table:', error);
    throw error;
  }
};

export const getAllTables = async (): Promise<Table[]> => {
  try {
    const tablesQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(tablesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Table[];
  } catch (error) {
    console.error('Error getting all tables:', error);
    throw error;
  }
};

export const getTablesByCapacity = async (minCapacity: number): Promise<Table[]> => {
  try {
    const tablesQuery = query(
      collection(db, COLLECTION_NAME),
      where('capacity', '>=', minCapacity),
      orderBy('capacity', 'asc')
    );
    
    const querySnapshot = await getDocs(tablesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Table[];
  } catch (error) {
    console.error('Error getting tables by capacity:', error);
    throw error;
  }
}; 