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
        mitt.emitter.emit('notification_error', "API health : " + error);
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
        mitt.emitter.emit('toppanelmenu_health', ['nmap', response.data.nmap]);
      })
      .catch(function (error) {
        // TODO envoyer en toast une erreur personnalisé nmap
        console.log(error);
        mitt.emitter.emit('notification_error', "API nmap : " + error);
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
        mitt.emitter.emit('toppanelmenu_health', ['dependencies', response.data.dependencies]);
      })
      .catch(function (error) {
        // handle error
        mitt.emitter.emit('notification_error', "API dependencies : " + error);
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
        mitt.emitter.emit('toppanelmenu_addressfamily', response.data);
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
        mitt.emitter.emit('toppanelmenu_health', ['interfaces', 'true']);
        mitt.emitter.emit('toppanelmenu_interfaces', response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
        mitt.emitter.emit('notification_error', "API interface : " + error);
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

mitt.emitter.on('parent', (texte) => EchoSounderApp.print_event(texte));
mitt.emitter.on('check_health', () => EchoSounderApp.getHealth());

// events de notification en bas à droite
mitt.emitter.on('notification_info', (toast) => notificationPanelMenuApp.infoToast(toast));
mitt.emitter.on('notification_error', (toast) => notificationPanelMenuApp.errorToast(toast));

// events de mise à jour des info du menu haut à partir de getHealth
mitt.emitter.on('toppanelmenu_health', (keyvalue) => topPanelMenuApp.addOrUpdateHealtValue(keyvalue));
mitt.emitter.on('toppanelmenu_interfaces', (interfacedata) => topPanelMenuApp.updateInterfaces(interfacedata));
mitt.emitter.on('toppanelmenu_addressfamily', (addressfamilydata) => topPanelMenuApp.updateAddrFamily(addressfamilydata));

// fonction de mise à jour de cible pour leftPanelMenu
mitt.emitter.on('leftpanelmenu_cible', (cible) => leftPanelMenuApp.addOrUpdateCible(cible));

// fonction de mise à jour de donnée node/service pour rightPanelMenu
mitt.emitter.on('rightpanelmenu_ip', (machine) => rightPanelMenuApp.addOrUpdateMachine(machine));
mitt.emitter.on('rightpanelmenu_service', (service) => rightPanelMenuApp.addOrUpdateService(service));

// fonctions d'envoie des demandes de scans au graph
mitt.emitter.on('scan_local', (scanobj) => graphNetworkApp.receiveEmitRequestLocalScan(scanobj));
mitt.emitter.on('scan_general', (scanobj) => graphNetworkApp.receiveEmitRequestGeneralScan(scanobj));
// fonction d'envoie des demandes d'export/import au graph
mitt.emitter.on('request_export', (typeexport) => graphNetworkApp.exportGraph(typeexport));
mitt.emitter.on('request_import_json', (file) => graphNetworkApp.importJson(file));
// fonction générales de manipulation du graph par les menu
mitt.emitter.on('request_action_graph', (action) => graphNetworkApp.actionGraph(action));

// fonction de mise à jour du thème graphique pour cytoscape
mitt.emitter.on('reloadStyle', (theme) => graphNetworkApp.loadStyle());