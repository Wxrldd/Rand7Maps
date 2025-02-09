import { StatusBar } from 'expo-status-bar';
import { View, Image, TouchableOpacity, Text, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { data } from './data/data.js';
import * as Haptics from 'expo-haptics';

export default function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedMap, setSelectedMap] = useState(null);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionComplete, setSelectionComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const buttonSound = useRef(null);
  const backgroundMusic = useRef(null);
  const searchSound = useRef(null);
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const borderColors = ['#ff5733', '#33ff57', '#3357ff', '#ff33a1', '#ffdd33'];

  useEffect(() => {
    async function playMusic() {
      const { sound } = await Audio.Sound.createAsync(
        require('./music/intro.mp3'),
        { shouldPlay: true, isLooping: true, volume: 0.3 }
      );
      backgroundMusic.current = sound;
      await backgroundMusic.current.playAsync();
    }

    async function loadButtonSound() {
      const { sound } = await Audio.Sound.createAsync(
        require('./music/click.mp3'),
        { volume: 0.2 }
      );
      buttonSound.current = sound;
    }

    async function loadSearchSound() {
      const { sound } = await Audio.Sound.createAsync(
        require('./music/random.mp3'),
        { volume: 0.2 }
      );
      searchSound.current = sound;
    }

    playMusic();
    loadButtonSound();
    loadSearchSound();

    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    return () => {
      if (buttonSound.current) {
        buttonSound.current.unloadAsync();
      }
      if (backgroundMusic.current) {
        backgroundMusic.current.unloadAsync();
      }
      if (searchSound.current) {
        searchSound.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (selectionComplete) {
      Animated.spring(bounceAnim, {
        toValue: 1.2,
        friction: 2,
        tension: 160,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 2,
          tension: 160,
          useNativeDriver: true,
        }).start(() => {});
      });
    }
  }, [selectionComplete]);

  const handlePress = async () => {
    if (backgroundMusic.current) {
      await backgroundMusic.current.stopAsync();
    }

    if (buttonSound.current) {
      await buttonSound.current.replayAsync();
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      startMapSelection();
    });
  };

  const startMapSelection = () => {
    if (isSelecting) return;
    setIsSelecting(true);
    setSelectionComplete(false);

    if (backgroundMusic.current) {
      backgroundMusic.current.setVolumeAsync(0.1);
    }

    if (searchSound.current) {
      searchSound.current.playAsync();
    }

    let interval =550;
    let totalTime = 0;
    let maxTime = 9700;

    const intervalId = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * data.length);
      setSelectedMap(data[randomIndex]);
      setBorderColor(borderColors[Math.floor(Math.random() * borderColors.length)]);

      totalTime += interval;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (totalTime >= maxTime) {
        clearInterval(intervalId);
        setIsSelecting(false);
        setSelectionComplete(true);

        if (backgroundMusic.current) {
          backgroundMusic.current.setVolumeAsync(0.3);
        }

        if (searchSound.current) {
          searchSound.current.stopAsync();
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        interval += 200;
      }
    }, interval);
  };

  const rotateInterpolate = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.wrapper}>
      {selectedMap && selectionComplete && <Image source={selectedMap.boardView} blurRadius={10}
        style={styles.backgroundImage} />}
      <Image source={require('./assets/nuages.png')} style={styles.cloud} />

      {isVisible ? (
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.container}>
            <Image source={require('./assets/loading.png')} style={styles.image} />
            <StatusBar style="auto" />
          </View>
          <Animated.Image source={require('./assets/cube.png')} style={[styles.cube, { transform: [{ rotate: rotateInterpolate }] }]} />
        </Animated.View>
      ) : (
        selectedMap && (
          <View style={styles.selectedMapContainer}>
            {selectionComplete ? (
              <>
                <Text style={styles.mapTitle}>{selectedMap.name}</Text>
                <Animated.Image
                  source={selectedMap.boardIcon}
                  resizeMode="contain"
                  style={[styles.selectedMapImage, { transform: [{ scale: bounceAnim }] }]}

                />
                <Text style={styles.mapDescription}>{selectedMap.description}</Text>
              </>
            ) : (
              <Image source={selectedMap.boardIcon}
                resizeMode="contain"
                style={styles.selectedMapImage} />
            )}
          </View>
        )
      )}

      <TouchableOpacity style={styles.button} onPress={handlePress} disabled={isSelecting}>
        <Text style={styles.buttonText}>Generate</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  container: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  image: {
    width: 310,
    height: 250,
  },
  cube: {
    marginTop: 20,
    marginLeft: 120,
    width: 75,
    height: 80,
  },
  button: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  cloud: {
    position: 'absolute',
    top: 30,
    left: 10,
    width: 130,
    height: 110,
    opacity: 0.7,
  },
  selectedMapContainer: {
    marginTop: 30,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  selectedMapImage: {
    width: 200,
    height: 200,
    marginVertical: 10,
  },
  mapTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 0,
    color: '#fff',
  },
  mapDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 20,
    fontWeight: 'bold',
  },
});
