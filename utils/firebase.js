import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

class Firebase {
  static async createDoc(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.log("Error creating document:", error);
    return null;
  }
}

  static async createDocWithName(collectionName, docName, data) {
    try {
      await setDoc(doc(db, collectionName, docName), data);
      console.log(docName + " created");
    } catch (error) {
      console.log(error);
    }
  }

  static async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap;
    } catch (error) {
      console.error("Error getting document:", error);
      throw error;
    }
  }

  static async getDocuments(collectionName) {
    try {
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);

      // ডকুমেন্টগুলোকে array আকারে রিটার্ন করুন
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return documents;
    } catch (error) {
      console.error("Error getting documents:", error);
      throw error;
    }
  }

  static async deleteDocument(collectionName, docId) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      console.error("Error getting document:", error);
      throw error;
    }
  }

  static async updateDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);

      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error getting document:", error);
      throw error;
    }
  }
}
export default Firebase;
