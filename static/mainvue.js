import mitt from "./emitter.js";
import topPanelMenu from "./top-panel-menu.js";
import leftPanelMenu from "./left-panel-menu.js";
import rightPanelMenu from "./right-panel-menu.js";
import notificationPanelMenu from "./notification-panel-menu.js";
import graphNetwork from "./graph-network.js";

// axios lib loaded before 
const { createApp } = Vue;

const app = Vue.createApp({

  mounted() {
    //lancement de la fonction de création du graph lorsque l'app se crée
    //this.CreateCytoGraph();
    //console.log(this);
    this.getHealth();
  },
	data() {
	  return {
        // ici on ajoute les variables manipulables de la page
        address_family: {},
        interfaces : {},
        cyto : {},
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
        console.log(response);
        mitt.emitter.emit('notification_info', "API fonctionnelle");
        this.getHealthNmap();
        this.getHealthModules();
        this.getAddressFamily();
        this.getInterfaces();
        mitt.emitter.emit('toppanelmenu_health', ['status', 'ok']);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
        mitt.emitter.emit('toppanelmenu_health', ['status', 'error']);
      });
    },
    // fonctions de vérification de présence de nmap
    getHealthNmap() {
      axios({
        method: 'get',
        url: '/json/health/nmap',
      })
      .then((response) => {
        console.log(response);
        this.health['nmap'] = response.data.nmap;
        mitt.emitter.emit('toppanelmenu_health', ['nmap', 'true']);
      })
      .catch(function (error) {
        // TODO envoyer en toast une erreur personnalisé nmap
        console.log(error);
        mitt.emitter.emit('toppanelmenu_health', ['nmap', 'false']);
      });
    },
    // fonctions de vérification de présence des dépendances 
    getHealthModules() {
      axios({
        method: 'get',
        url: '/json/health/dependencies',
      })
      .then((response) => {
        console.log(response);
        this.health['dependencies'] = response.data.dependencies;
        mitt.emitter.emit('toppanelmenu_health', ['dependencies', response.data.dependencies]);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
        mitt.emitter.emit('toppanelmenu_health', ['dependencies', 'error']);
      });
    },
    // fonction de récupération des familles d'adresses locales : 
    getAddressFamily() {
      axios({
        method: 'get',
        url: '/json/address_family',
      })
      .then((response) => {
        console.log(response);
        this.address_family = response.data;
      })
      .catch(function (error) {
        // handle error
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
        console.log(response);
        this.interfaces = response.data;
        mitt.emitter.emit('notification_info', "récupération list interfaces");
        mitt.emitter.emit('toppanelmenu_health', ['interfaces', 'true']);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
        mitt.emitter.emit('toppanelmenu_health', ['interfaces', 'false']);
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
const EchoSounderApp = app.mount('#EchoSounderApp');

const topPanelMenuApp = topPanelMenu.mount('#echo_panel_top');
const leftPanelMenuApp = leftPanelMenu.mount('#echo_panel_left');
const rightPanelMenuApp = rightPanelMenu.mount('#echo_panel_right');
const notificationPanelMenuApp = notificationPanelMenu.mount('#echo_panel_notification');
const graphNetworkApp = graphNetwork.mount('#placeNetwork');

console.log(notificationPanelMenuApp);

mitt.emitter.on('parent', (texte) => EchoSounderApp.print_event(texte));
mitt.emitter.on('notification_info', (toast) => notificationPanelMenuApp.infoToast(toast));
mitt.emitter.on('toppanelmenu_health', (keyvalue) => topPanelMenuApp.addOrUpdateHealtValue(keyvalue));