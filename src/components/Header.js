import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import React from 'react';

const Header = () => {
  return (
    <View
      style={styles.container}>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.MenuButton}>
          <Image
            resizeMode="contain"
            source={require('../assets/share.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.MenuButton}>
          <Image
            source={require('../assets/setting.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container:{
    width: '100%',
    height: 55,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'flex-end',
  },
  MenuButton: {
    backgroundColor: '#0dacf9',
    width: 60,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',

    padding: 5,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  buttons:{
    flexDirection:'row',
    gap:20,

  },
});
