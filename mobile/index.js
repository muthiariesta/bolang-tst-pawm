import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent memanggil AppRegistry.registerComponent('main', () => App)
// dan memastikan lingkungan siap, baik di Expo Go maupun di build native.
registerRootComponent(App);
