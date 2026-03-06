import { createApp } from 'vue'
import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { globalUtils } from '@/plugins/globalUtils.js';

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'
import { registerLicense } from '@syncfusion/ej2-base'

// todo: load license key from env
registerLicense("ORg4AjUWIQA/Gnt2XVhhQlJHfV5AQmBIYVp/TGpJfl96cVxMZVVBJAtUQF1hTH5QdkdhWntdcnZUQWhZ;Mgo+DSMBMAY9C3t2XVhhQlJHfV5AQmBIYVp/TGpJfl96cVxMZVVBJAtUQF1hTH5QdkdhWntdcnZUT2Re")

// Create vue app
const app = createApp(App)


// Register plugins
registerPlugins(app)

// Mount vue app

app.use(globalUtils);
app.mount('#app')
