import { StatusBar } from 'expo-status-bar';
import { View, Image, TouchableOpacity, Text, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { data } from './data/data.js';

export default function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedMap, setSelectedMap] = useState(null);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [isSelecting, setIsSelecting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const buttonSound = useRef(null);
  const backgroundMusic = useRef(null);

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

    playMusic();
    loadButtonSound();

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
    };
  }, []);

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
    
    let interval = 100;
    let totalTime = 0;
    let maxTime = 4000;

    const intervalId = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * data.length);
      setSelectedMap(data[randomIndex]);
      setBorderColor(borderColors[Math.floor(Math.random() * borderColors.length)]);
      totalTime += interval;
      
      if (totalTime >= maxTime) {
        clearInterval(intervalId);
        setIsSelecting(false);
      } else {
        interval += 50;
      }
    }, interval);
  };

  const rotateInterpolate = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.wrapper}>
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
            <Image source={selectedMap.boardIcon} style={styles.selectedMapImage} />
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
    marginTop: 40,
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
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
    opacity: 0.6,
  },
  selectedMapContainer: {
    marginTop: 30,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  selectedMapImage: {
    width: 150,
    height: 150,
  },
});
