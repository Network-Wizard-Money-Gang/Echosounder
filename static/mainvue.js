import mitt from "./emitter.js";
import { createPinia } from './js/pinia.esm-browser.js'
import {useStore} from './store.js';
import topPanelMenu from "./top-panel-menu.js";
import leftPanelMenu from "./left-panel-menu.js";
import rightPanelMenu from "./right-panel-menu.js";
import notificationPanelMenu from "./notification-panel-menu.js";
import graphNetwork from "./graph-network.js";

const pinia = createPinia();

const app = Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph lorsque l'app se crée
    //this.CreateCytoGraph();
    //console.log(this);
    this.getHealth();
  },
	data() {
    let store = useStore();
	  return {
        // ici on ajoute les variables manipulables de la page  
        address_family: {},
        cyto : {},
        // accès interne à l'objet store contenant tout les contextes partagés
        store : store,
	  }
	},
	methods: {
    // fonctions globale de vérification de santé de l'application
    getHealth() {
      axios({
        method: 'get',
        url: '/json/health',
      })
      .then((response) => {
        mitt.emitter.emit('notification_info', "API fonctionnelle");
        this.getHealthNmap();
        this.getHealthModules();
        this.getAddressFamily();
        this.getInterfaces();
        //mitt.emitter.emit('toppanelmenu_health', ['status', 'ok']);
        this.store.health.status = 'ok';
      })
      .catch(function (error) {
        // handle error
        console.log(error);
        mitt.emitter.emit('notification_error', "API health : " + error);
        //mitt.emitter.emit('toppanelmenu_health', ['status', 'error']);
        this.store.health.status = 'error';
      });
    },
    // fonctions de vérification de présence de nmap
    getHealthNmap() {
      axios({
        method: 'get',
        url: '/json/health/nmap',
      })
      .then((response) => {
        //mitt.emitter.emit('toppanelmenu_health', ['nmap', response.data.nmap]);
        this.store.health.nmap = response.data.nmap;
      })
      .catch(function (error) {
        console.log(error);
        mitt.emitter.emit('notification_error', "API nmap : " + error);
        //mitt.emitter.emit('toppanelmenu_health', ['nmap', 'false']);
        this.store.health.nmap = 'false';
      });
    },
    // fonctions de vérification de présence des dépendances 
    getHealthModules() {
      axios({
        method: 'get',
        url: '/json/health/dependencies',
      })
      .then((response) => {
        //mitt.emitter.emit('toppanelmenu_health', ['dependencies', response.data.dependencies]);
        this.store.health.dependencies = response.data.dependencies;
      })
      .catch(function (error) {
        // handle error
        mitt.emitter.emit('notification_error', "API dependencies : " + error);
        //mitt.emitter.emit('toppanelmenu_health', ['dependencies', 'error']);
        this.store.health.dependencies = 'error';
      });
    },
    // fonction de récupération des familles d'adresses locales : 
    getAddressFamily() {
      axios({
        method: 'get',
        url: '/json/address_family',
      })
      .then((response) => {
        //mitt.emitter.emit('toppanelmenu_addressfamily', response.data);
        this.store.address_family = response.data;
      })
      .catch(function (error) {
        // handle error
        mitt.emitter.emit('notification_error', "API adressfamily : " + error);
        console.log(error);
      });
    },
    // fonction de récupération des interfaces 
    getInterfaces() {
      axios({
        method: 'get',
        url: '/json/interfaces',
      })
      .then((response) => {
        mitt.emitter.emit('notification_info', "récupération list interfaces");
        //mitt.emitter.emit('toppanelmenu_health', ['interfaces', 'true']);
        this.store.health.interfaces = 'true';
        //mitt.emitter.emit('toppanelmenu_interfaces', response.data);
        console.log(response.data);
        this.store.interfaces = response.data;
//        this.store.interfaces = response.data;
        console.log(this.store);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
        mitt.emitter.emit('notification_error', "API interface : " + error);
        //mitt.emitter.emit('toppanelmenu_health', ['interfaces', 'false']);
        this.store.health.interfaces = 'false';
      });
    },
    // fonction d'envoie sur console de message
    print_event(texte) {
      console.log(texte);
    },
  },
});

app.use(Quasar);
Quasar.Lang.set(Quasar.Lang.fr)
Quasar.IconSet.set(Quasar.IconSet.lineAwesome);

// on associe à Pinia les apps
app.use(pinia);
topPanelMenu.use(pinia);
leftPanelMenu.use(pinia);

const EchoSounderApp = app.mount('#EchoSounderApp');

const topPanelMenuApp = topPanelMenu.mount('#echo_panel_top');
const leftPanelMenuApp = leftPanelMenu.mount('#echo_panel_left');
const rightPanelMenuApp = rightPanelMenu.mount('#echo_panel_right');
const notificationPanelMenuApp = notificationPanelMenu.mount('#echo_panel_notification');
const graphNetworkApp = graphNetwork.mount('#placeNetwork');

// on insère toutes les app dans le store pour rendre leurs fonctions accessibles aux autres
let initStore = useStore();
initStore.EchoSounderApp = EchoSounderApp;
initStore.topPanelMenuApp = topPanelMenuApp;
initStore.leftPanelMenuApp = leftPanelMenuApp;
initStore.rightPanelMenuApp = rightPanelMenuApp;
initStore.notificationPanelMenuApp = notificationPanelMenuApp;
initStore.graphNetworkApp = graphNetworkApp;

// events de notification en bas à droite
mitt.emitter.on('notification_info', (toast) => notificationPanelMenuApp.infoToast(toast));
mitt.emitter.on('notification_error', (toast) => notificationPanelMenuApp.errorToast(toast));

// fonction de mise à jour du thème graphique pour cytoscape
mitt.emitter.on('reloadStyle', (theme) => graphNetworkApp.loadStyle());