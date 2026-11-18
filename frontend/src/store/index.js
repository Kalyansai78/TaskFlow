import { createSlice, configureStore } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    isLoggedIn: false
};

const authSlice = createSlice({
    name: "auth",

    initialState,

    reducers: {
        login(state, action) {
            state.isLoggedIn = true;

            if (action.payload) {
                state.user = action.payload;
            }
        },

        logout(state) {
            state.user = null;
            state.isLoggedIn = false;
        }
    }
});

export const authActions = authSlice.actions;

export const store = configureStore({
    reducer: authSlice.reducer
});