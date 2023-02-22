import firebase from 'firebase/compat/app';
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject, getMetadata } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCJvCM-z-kt8Zwy92FfyR1mqQ-OTXu9Nrk",
    authDomain: "matlunch-7c378.firebaseapp.com",
    projectId: "matlunch-7c378",
    storageBucket: "matlunch-7c378.appspot.com",
    messagingSenderId: "945280422852",
    appId: "1:945280422852:web:cf669644e7d1d46f45ca91",
    measurementId: "G-QFNNYH9FWJ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export {getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject, getMetadata};
