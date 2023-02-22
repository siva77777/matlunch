import React, { useState, useEffect } from 'react';
import { View, Button, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as firebase from './firebase';
const ALL = 'all';
const VEGS = 'vegs';
const VEGL = 'vegl';
const NONVEGS = 'nonvegs';
const NONVEGL = 'nonvegl'
const styles = StyleSheet.create({
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  filterButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  filterButtonSelected: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    color: '#000',
  },
  filterButtonTextSelected: {
    color: '#FFF',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    borderRadius: 20,
    padding: 5
  },
  deleteIcon: {
    color: 'white',
    fontSize: 20,
  }
});
const filters = [
  { name: 'All', value: ALL},
  { name: 'Veg Small', value: VEGS },
  { name: 'Veg Large', value: VEGL },
  { name: 'Non Veg Small', value: NONVEGS },
  { name: 'Non Veg Large', value: NONVEGL },
];

export default function App() {
  const storage = firebase.getStorage();
  const ref = firebase.ref(storage);
  const imagesRef = firebase.ref(ref, 'images');
  const [images, setImages] = useState([]);

  const uploadImage = (type) => {
    try {
    launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      const uri = response && response.assets && response.assets[0].uri;
      if (uri) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storage = firebase.getStorage();
        const ref = firebase.ref(storage);
        const childRef = firebase.ref(ref, `images/${Date.now()}`);
        const metadata = {
          customMetadata: {
            type: type
          }
        };
        const snapshot = await firebase.uploadBytes(childRef, blob, metadata);
        firebase.getDownloadURL(snapshot.ref).then(async (url) => {
          console.log('Image uploaded');
          const imgs = [...images, url];
          setImages(prevImages => [...prevImages, url]);
          let filteredData = imgs.slice();
          if (selectedFilter !== ALL) {
            filteredData = await filterImagesByMetadata(selectedFilter, imgs);
            setFilteredImages(filteredData);
          }
        });
      }
    });
  } catch (error) {
    console.log(error);
  }}

  const [selectedFilter, setSelectedFilter] = useState(ALL);
  const [filteredImages, setFilteredImages] = useState(images);

  const handleFilterPress = async (value) => {
    setSelectedFilter(value);
    let filteredData = images.slice();
    if (value !== ALL) {
      filteredData = await filterImagesByMetadata(value, images);
    }
    setFilteredImages(filteredData);
  };

  useEffect(() => {
    // Fetch the download URLs of all images in the "images" folder
    firebase.listAll(imagesRef).then(result => {
      Promise.all(result.items.map(imageRef => firebase.getDownloadURL(imageRef))).then(urls => {
        setImages(urls);
      });
    });
  }, []);

  const onDelete = (index, url) => {
    const path = url.split('%2F')[1].split('?')[0];
    const imageRef = firebase.ref(ref, 'images/' + path);
    firebase.deleteObject(imageRef).then(() => {
      firebase.listAll(imagesRef).then(result => {
        Promise.all(result.items.map(imageRef => firebase.getDownloadURL(imageRef))).then(async urls => {
          setImages(urls);
          let filteredData = urls.slice();
          if (selectedFilter !== ALL) {
            filteredData = await filterImagesByMetadata(selectedFilter, urls);
            setFilteredImages(filteredData);
          }
        })});
    }, () => {
      Alert.alert('Alert', 'Delete failed')
    });
  };

  const filterImagesByMetadata = async (selectedFilter, images) => {
    const filteredImages = [];
    for (const image of images) {
      const path = image.split('%2F')[1].split('?')[0];
      const imageRef = firebase.ref(ref, 'images/' + path);
      const metadata = await firebase.getMetadata(imageRef);
      if (metadata.customMetadata.type === selectedFilter) {
        filteredImages.push(image);
      }
    }
    return filteredImages;
  };

  const DisplayImages = () => {
    return (
      <View>
        <FlatList
          data={selectedFilter !== ALL ? filteredImages : images}
          numColumns={3}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View>
              <Image
                source={item}
                style={{ width: 200, height: 200, marginRight: 3 }}
              />
              <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(index, item)}>
                <MaterialIcons name="delete" style={styles.deleteIcon} />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    )
  }

  const [showFoodMenu, setShowFoodMenu] = useState(false);

  const toggleFoodMenu = () => {
    setShowFoodMenu(!showFoodMenu);
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity style={{ padding: 20, backgroundColor: '#f0f0f0', marginBottom: 10 }} onPress={toggleFoodMenu}>
        <Text style={{ color: 'black' }}>Upload Image</Text>
      </TouchableOpacity>
      {showFoodMenu && (
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <TouchableOpacity style={{ padding: 20, backgroundColor: '#f0f0f0', marginRight: 3 }} onPress={() => uploadImage(VEGS)}>
            <Text style={{ color: 'black' }}>Veg Small</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 20, backgroundColor: '#f0f0f0', marginRight: 3 }} onPress={() => uploadImage(VEGL)}>
            <Text style={{ color: 'black' }}>Veg Large</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 20, backgroundColor: '#f0f0f0', marginRight: 3 }} onPress={() => uploadImage(NONVEGS)}>
            <Text style={{ color: 'black' }}>Non Veg Small</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 20, backgroundColor: '#f0f0f0' }} onPress={() => uploadImage(NONVEGL)}>
            <Text style={{ color: 'black' }}>Non Veg Large</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.filtersContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              selectedFilter === filter.value && styles.filterButtonSelected,
            ]}
            onPress={() => handleFilterPress(filter.value)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter.value && styles.filterButtonTextSelected,
            ]}>
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <DisplayImages filter={selectedFilter}/>
    </View>
  )}
