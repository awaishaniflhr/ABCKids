import {StyleSheet, Text, View} from 'react-native';
import {StatusBar} from 'react-native';
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Home from '../screens/Home';
import AlphabetsShapes from '../screens/AlphabetsShapes';
import Coloring from '../screens/Coloring';
import ColorsTemplate from '../screens/ColorsTemplate';
import Loader from '../screens/Loader';
import DragLetters from '../screens/DragLetters';
import Letters from '../screens/Letters';
import TracingLetters from '../screens/TracingLetters';
import LetterTracing from '../screens/LetterTracing';
import BalloonPopping from '../screens/BalloonPopping';
import Numbers from '../screens/Numbers';
import Numeric from '../screens/Numeric';
import PoppBalloonsTemplate from '../screens/PoppBalloonsTemplate';
import MemoryFlipGame from '../screens/MemoryFlipGame';
import FunctionScreen from '../screens/FruitName';
import FruitName from '../screens/FruitName';
import NumberKeyboard from '../screens/NumberKeyboard';
import Sounds from '../screens/Sounds';
import SoundScreen from '../screens/SoundScreen';
import LetterSound from '../screens/LetterSound';
import Phone from '../screens/Phone';
import BirdSound from '../screens/BirdSound';
import Poem from '../screens/Poems';
import Poems from '../screens/Poems';
const Stack = createNativeStackNavigator();
const MainStack = () => {
  return (
    <>
      <StatusBar hidden={true} />
      <Stack.Navigator screenOptions={{
        headerShown: false,
        statusBarHidden: true,
        navigationBarHidden: true,
        statusBarAnimation: 'none',
        contentStyle: {backgroundColor: '#daf5f7'},
      }}>
        <Stack.Screen
          name="Home"
          component={Home}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AlphabetsShapes"
          component={AlphabetsShapes}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Coloring"
          component={Coloring}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ColorsTemplate"
          component={ColorsTemplate}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Loader"
          component={Loader}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="DragLetters"
          component={DragLetters}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Letters"
          component={Letters}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TracingLetters"
          component={TracingLetters}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LetterTracing"
          component={LetterTracing}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="BalloonPopping"
          component={BalloonPopping}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Numbers"
          component={Numbers}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Numeric"
          component={Numeric}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="PoppBalloonsTemplate"
          component={PoppBalloonsTemplate}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MemoryFlipGame"
          component={MemoryFlipGame}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FruitName"
          component={FruitName}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="NumberKeyboard"
          component={NumberKeyboard}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Sounds"
          component={Sounds}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SoundScreen"
          component={SoundScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LetterSound"
          component={LetterSound}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="BirdSound"
          component={BirdSound}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Phone"
          component={Phone}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Poems"
          component={Poems}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </>
  );
};

export default MainStack;

const styles = StyleSheet.create({});
