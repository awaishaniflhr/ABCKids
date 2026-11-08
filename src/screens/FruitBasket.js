import BackIcon from '../components/BackIcon';
import ScreenContainer from '../components/ScreenContainer';
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Dimensions, Image, ImageBackground, Animated, PanResponder } from 'react-native';
import LinearGradient from '../components/LinearGradient';
import SoundPlayer from '../utills/SoundPlayer';
import AnimatedLottieView from 'lottie-react-native';
const {
  width,
  height
} = Dimensions.get('window');
const Balloon = ({
  id,
  position,
  size,
  color,
  alphabet,
  onPop
}) => {
  const [popped, setPopped] = useState(false);
  const handlePop = () => {
    if (!popped) {
      setPopped(true);
      onPop(id, color);
    }
  };
  return <TouchableOpacity style={[styles.balloon, {
    left: position.x,
    bottom: position.y,
    width: size,
    height: size,
    top: position.y,
    borderRadius: size / 2,
    backgroundColor: 'transparent' // Remove background color
  }]} onPress={handlePop}>
      {color === 'transparent' ? <ImageBackground source={require('../assets/balloontransparent.png')} style={styles.balloonImage}></ImageBackground> : color === 'blue' ? <ImageBackground source={require('../assets/apple1.png')} style={styles.balloonImage}></ImageBackground> : color === 'green' ? <ImageBackground source={require('../assets/grapes.png')} style={styles.balloonImage}></ImageBackground> : color === 'yellow' ? <ImageBackground source={require('../assets/grapes.png')} style={styles.balloonImage}></ImageBackground> : color === 'orange' ? <ImageBackground source={require('../assets/pineapple.png')} style={styles.balloonImage}></ImageBackground> : color === 'black' ? <ImageBackground source={require('../assets/bomb.png')} style={styles.bombImage}></ImageBackground> : <ImageBackground source={require('../assets/strawberry.png')} style={styles.balloonImage}></ImageBackground>}
    </TouchableOpacity>;
};
const BalloonPopping = ({
  navigation
}) => {
  const selectedAnim = useRef(new Animated.Value(1)).current;
  const [balloons, setBalloons] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showGameOver, setGameOver] = useState(false);
  const [rabbitPosition, setRabbitPosition] = useState(width / 2);
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, {
      dx: pan.x
    }]),
    onPanResponderRelease: () => {
      pan.extractOffset();
    }
  })).current;
  useEffect(() => {
    const balloonTimer = setInterval(() => {
      if (time > 0) {
        const newBalloon = {
          id: Math.random().toString(),
          position: {
            x: Math.random() * (width - 100),
            y: height - 850
          },
          size: Math.random() * (100 - 50) + 50,
          color: Math.random() < 0.2 ? 'black' // black
          : Math.random() < 0.4 ? 'blue' : Math.random() < 0.6 ? 'red' : Math.random() < 0.8 ? 'green' : 'yellow',
          alphabet: getRandomAlphabet()
        };
        setBalloons(prevBalloons => [...prevBalloons, newBalloon]);
        setTime(prevTime => prevTime - 1);
      } else {
        clearInterval(balloonTimer);
      }
    }, 1000);
    return () => {
      clearInterval(balloonTimer);
    };
  }, [time]);
  useEffect(() => {
    const moveBalloons = setInterval(() => {
      setBalloons(prevBalloons => prevBalloons.map(balloon => {
        const newY = balloon.position.y + 10;
        return {
          ...balloon,
          position: {
            ...balloon.position,
            y: newY
          }
        };
      }));
    }, 100);
    return () => {
      clearInterval(moveBalloons);
    };
  }, []);
  const handleDeviceTilt = event => {
    const {
      x
    } = event.nativeEvent.rotation;
    const newPosition = width / 2 + x * 10;
    setRabbitPosition(newPosition);
  };
  const handlePop = (balloonId, color) => {
    if (color === 'black') {
      setScore(prevScore => Math.max(prevScore - 1, 0));
      SoundPlayer.playSoundFile('bomb', 'mp3');
    } else {
      setScore(prevScore => prevScore + 1);
    }
    setBalloons(prevBalloons => prevBalloons.filter(balloon => balloon.id !== balloonId));
  };
  useEffect(() => {
    if (time === 0) {
      if (score >= 10) {
        setShowWinModal(true);
        SoundPlayer.playSoundFile('modalsound', 'mp3');
      } else {
        setGameOver(true);
        SoundPlayer.playSoundFile('lose', 'mp3');
      }
    }
  }, [time, score]);
  ;
  const handleGameOver = () => {
    setGameOver(true);
    SoundPlayer.playSoundFile('lose', 'mp3');
  };
  const handleGameWin = () => {
    setShowWinModal(true);
    SoundPlayer.playSoundFile('modalsound', 'mp3');
  };
  const handleReloadGame = () => {
    setShowWinModal(false);
    setGameOver(false);
    setBalloons([]);
    setScore(0);
    setTime(30);
  };
  const getRandomAlphabet = () => {
    const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomIndex = Math.floor(Math.random() * alphabets.length);
    return alphabets.charAt(randomIndex);
  };
  const back = ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)'];
  return <ScreenContainer source={require('../assets/bg.jpg')} style={styles.container}>
      <LinearGradient style={{
      flex: 1,
      width: '100%',
      padding: 20
    }} colors={back} start={{
      x: 0,
      y: 4
    }} end={{
      x: 0,
      y: 2
    }}>
        {balloons.map(balloon => <Balloon key={balloon.id} id={balloon.id} position={balloon.position} size={balloon.size} color={balloon.color} alphabet={balloon.alphabet} onPop={handlePop} />)}
        {/* <View style={[styles.rabbit, { left: rabbitPosition - 50 }]}>
          <Image source={require('../assets/lion.png')} style={styles.rabbitImage} />
         </View> */}

        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.time}>Time: {time}</Text>
        <Animated.View style={{
        position: 'absolute',
        bottom: 20,
        transform: [{
          translateX: pan.x
        }, {
          translateY: pan.y
        }]
      }} {...panResponder.panHandlers}>
          <View style={styles.box}>
          <Image source={require('../assets/basket2.png')} style={styles.rabbitImage} />
          </View>
        </Animated.View>
        {showWinModal ? <View style={{
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
      }}>
            <AnimatedLottieView autoPlay loop speed={0.3} source={require('../assets/win.json')} style={{
          width: '100%',
          height: 350
        }} />
            <Text style={{
          fontSize: 50,
          fontWeight: 'bold',
          color: 'white',
          position: 'absolute',
          top: 120
        }}>
              You Win!
            </Text>
            <View style={{
          alignItems: 'center',
          position: 'absolute',
          justifyContent: 'space-evenly',
          width: '30%',
          flexDirection: 'row',
          bottom: 80
        }}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <BackIcon style={styles.backIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReloadGame}>
                <Image style={styles.backIcon} source={require('../assets/reloadBtn.png')} />
              </TouchableOpacity>
            </View>
            <Animated.View style={[{
          transform: [{
            scale: selectedAnim
          }]
        }]}></Animated.View>
          </View> : null}
        {showGameOver ? <View style={{
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
      }}>
            <Text style={{
          fontSize: 50,
          fontWeight: 'bold',
          color: 'yellow',
          position: 'absolute',
          top: 300
        }}>
              You Loss!
            </Text>
            <Text style={{
          fontSize: 18,
          fontWeight: 'normal',
          color: 'orange',
          position: 'absolute',
          top: 180
        }}>
              Minimum 10 Balloons Popped
            </Text>
            <View style={{
          alignItems: 'center',
          position: 'absolute',
          justifyContent: 'space-evenly',
          width: '30%',
          flexDirection: 'row',
          top: 230
        }}>
              <TouchableOpacity onPress={() => {
            navigation.goBack();
          }}>
                <BackIcon style={styles.backIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReloadGame}>
                <Image style={styles.backIcon} source={require('../assets/reloadBtn.png')} />
              </TouchableOpacity>
            </View>
            <Animated.View style={[{
          transform: [{
            scale: selectedAnim
          }]
        }]}></Animated.View>
          </View> : null}
      </LinearGradient>
    </ScreenContainer>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'gray'
  },
  balloon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center'
  },
  alphabet: {
    fontSize: 38,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center'
  },
  bombImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain'
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20
  },
  time: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10
  },
  backIcon: {
    height: 60,
    width: 60
  },
  balloonImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    justifyContent: 'center',
    alignItems: 'center'
  },
  box: {
    height: 150,
    width: 150
  },
  rabbit: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 100
  },
  rabbitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  }
});
export default BalloonPopping;
