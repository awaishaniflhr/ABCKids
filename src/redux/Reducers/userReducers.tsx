import {createSlice} from '@reduxjs/toolkit';

const initialState: any = {
  user: null,
  isLogin: false,
};

export const userReducer = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },

    setIsLogin: (state, action) => {
      state.isLogin = action.payload;
    },
  },
});

export const {setUser, setIsLogin} = userReducer.actions;

export default userReducer.reducer;
