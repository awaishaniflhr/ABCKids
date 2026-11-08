import BackIcon from '../components/BackIcon';
import ScreenContainer from '../components/ScreenContainer';
import { StyleSheet, Text, View, Image, TouchableOpacity, Vibration, ImageBackground, Animated } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import Draggable from '../components/Draggable';
import AnimatedLottieView from 'lottie-react-native';
import * as Animatable from 'react-native-animatable';
import Header3 from '../components/Header3';
import { broth } from '../utills/fonts';
const ColumnMatchingGame = ({
  navigation
}) => {
  const [isModal, setIsModal] = useState(false);
  const [position, setPosition] = useState({
    x: 0,
    y: 0
  });
  const [color, setColor] = useState(false);
  const [color1, setColor1] = useState(false);
  const [color2, setColor2] = useState(false);
  const [color3, setColor3] = useState(false);
  const [color4, setColor4] = useState(false);
  const selectedAnim = useRef(new Animated.Value(1)).current;
  const handleDragRelease = (e, gestureState) => {
    const {
      moveX,
      moveY
    } = gestureState;
    setPosition({
      x: moveX,
      y: moveY
    });
    console.log(position.x, position.y);
    if (position.x > 1 && position.x < 150 && position.y > 120 && position.y < 280) {
      setColor(true);
    } else {
      setColor(false);
      Vibration.vibrate(1000);
    }
  };
  const handleDragRelease1 = (e, gestureState) => {
    const {
      moveX,
      moveY
    } = gestureState;
    setPosition({
      x: moveX,
      y: moveY
    });
    console.log(position.x, position.y);
    if (position.x > 1 && position.x < 150 && position.y > 280 && position.y < 480) {
      setColor1(true);
    } else {
      setColor1(false);
      Vibration.vibrate(1000);
    }
  };
  const handleDragRelease2 = (e, gestureState) => {
    const {
      moveX,
      moveY
    } = gestureState;
    setPosition({
      x: moveX,
      y: moveY
    });
    console.log(position.x, position.y);
    if (position.x > 1 && position.x < 150 && position.y > 50 && position.y < 120) {
      setColor2(true);
    } else {
      setColor2(false);
      Vibration.vibrate(1000);
    }
  };
  const handleDragRelease3 = (e, gestureState) => {
    const {
      moveX,
      moveY
    } = gestureState;
    setPosition({
      x: moveX,
      y: moveY
    });
    console.log(position.x, position.y);
    if (position.x > 1 && position.x < 150 && position.y > 480 && position.y < 680) {
      setColor3(true);
    } else {
      setColor3(false);
      Vibration.vibrate(1000);
    }
  };
  const handleDragRelease4 = (e, gestureState) => {
    const {
      moveX,
      moveY
    } = gestureState;
    setPosition({
      x: moveX,
      y: moveY
    });
    console.log(position.x, position.y);
    if (position.x == 0 && position.y == 0) {
      setColor4(false);
    } else if (position.x > 1 && position.x < 150 && position.y > 680 && position.y < 900) {
      setColor4(true);
    } else {
      setColor4(false);
      Vibration.vibrate(1000);
    }
  };
  useEffect(() => {
    if (color == true && color1 == true && color2 == true && color3 == true && color4 == true) {
      setIsModal(true);
      console.log('Modal');
    }
  }, [color, color1, color2, color3, color4]);
  const handleModal = () => {
    setIsModal(false);
    setColor(false);
    setColor1(false);
    setColor2(false);
    setColor3(false);
    setColor4(false);
    console.log('ggggggggg');
  };
  return <ScreenContainer style={{
    flex: 1
  }}>
      <ImageBackground source={require('../assets/bg.jpg')} style={{
      flex: 1
    }}>
        <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)'
      }}>
          <Header3 navigation={navigation} text={'Match The Animals '} color={'#fff'} fontFamily={broth} fontSize={30} />
          <View style={{
          flex: 1,
          justifyContent: 'center',
          padding: 20,
          alignItems: 'center'
        }}>
            {isModal ? <View style={{
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
              width: '50%',
              flexDirection: 'row',
              bottom: 80
            }}>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <BackIcon style={styles.backIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleModal()}>
                    <Animatable.Image animation="pulse" easing="ease-out" iterationCount="infinite" style={styles.backIcon} source={require('../assets/reloadBtn.png')}></Animatable.Image>
                  </TouchableOpacity>
                </View>
                <Animated.View style={[{
              transform: [{
                scale: selectedAnim
              }]
            }]}></Animated.View>
              </View> : <View style={{
            flex: 1,
            flexDirection: 'row'
          }}>
                <View style={{
              justifyContent: 'space-around',
              width: '100%'
            }}>
                  <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center'
              }}>
                    <Image resizeMode="contain" style={{
                  height: 80,
                  width: 80,
                  tintColor: color2 ? null : 'rgba(255,255,255,0.5)'
                }} source={require('../assets/lion.png')} />
                    {color4 ? <Image style={styles.tick} source={require('../assets/tick.png')} /> : null}
                  </View>
                  <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center'
                // backgroundColor:'gray'
              }}>
                    <Image resizeMode="contain" style={{
                  height: 80,
                  width: 80,
                  tintColor: color ? null : 'rgba(255,255,255,0.5)'
                }} source={require('../assets/zebra.png')} />
                    {color3 ? <Image style={styles.tick} source={require('../assets/tick.png')} /> : null}
                  </View>
                  <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center'
              }}>
                    <Image resizeMode="contain" style={{
                  height: 80,
                  width: 80,
                  tintColor: color1 ? null : 'rgba(255,255,255,0.5)'
                }} source={require('../assets/cat.png')} />
                    {color2 ? <Image style={styles.tick} source={require('../assets/tick.png')} /> : null}
                  </View>
                  <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center'
              }}>
                    <Image resizeMode="contain" style={{
                  height: 80,
                  width: 80,
                  tintColor: color3 ? null : 'rgba(255,255,255,0.5)'
                }} source={require('../assets/tiger.png')} />
                    {color1 ? <Image style={styles.tick} source={require('../assets/tick.png')} /> : null}
                  </View>
                  <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center'
              }}>
                    <Image resizeMode="contain" style={{
                  height: 80,
                  width: 80,
                  tintColor: color4 ? null : 'rgba(255,255,255,0.5)'
                }} source={require('../assets/wolf.png')} />
                    {color ? <Image style={styles.tick} source={require('../assets/tick.png')} /> : null}
                  </View>
                </View>
                {color4 ? null : <Draggable shouldReverse={color4 ? false : true} onDragRelease={handleDragRelease4} x={250} y={50}>
                    <Image resizeMode="contain" style={{
                height: 80,
                width: 80
              }} source={require('../assets/wolf.png')} />
                  </Draggable>}
                {color3 ? null : <Draggable shouldReverse={color3 ? false : true} onDragRelease={handleDragRelease3} x={250} y={160}>
                    <Image resizeMode="contain" style={{
                height: 80,
                width: 80
              }} source={require('../assets/tiger.png')} />
                  </Draggable>}
                {color2 ? null : <Draggable shouldReverse={color2 ? false : true} onDragRelease={handleDragRelease2} x={250} y={320}>
                    <Image resizeMode="contain" style={{
                height: 80,
                width: 80
              }} source={require('../assets/lion.png')} />
                  </Draggable>}
                {color1 ? null : <Draggable shouldReverse={color1 ? false : true} onDragRelease={handleDragRelease1} x={250} y={490}>
                    <Image resizeMode="contain" style={{
                height: 80,
                width: 80
              }} source={require('../assets/cat.png')} />
                  </Draggable>}
                {color ? null : <Draggable shouldReverse={color ? false : true} onDragRelease={handleDragRelease} x={250} y={630}>
                    <Image resizeMode="contain" style={{
                height: 80,
                width: 80
              }} source={require('../assets/zebra.png')} />
                  </Draggable>}
              </View>}
          </View>
        </View>
      </ImageBackground>
    </ScreenContainer>;
};
export default ColumnMatchingGame;
const styles = StyleSheet.create({
  tick: {
    height: 20,
    width: 20
  },
  backIcon: {
    height: 60,
    width: 60
    // marginLeft: 20,
  }
});
