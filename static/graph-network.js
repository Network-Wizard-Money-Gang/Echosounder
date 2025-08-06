import mitt from './emitter.js';

const { createApp } = Vue;

export default Vue.createApp({
  mounted() {
    //lancement de la fonction de création du graph
    mitt.emitter.emit('parent', "AppVue Graph créée");
    // une foie l'application monté sur le DOM, on crée le graph
    this.cyto = cytoscape({
      container: document.getElementById('mynetwork')
    });
    // création des évènements du graph
    this.cyto.on('tap', 'node', function(evt){
      // on envoie aux apps vue le noeud à afficher :
      if(evt.target.data('type') == 'VLAN') {
        mitt.emitter.emit("graph_vlan", evt.target.data());
      }
      if(evt.target.data('type') == 'IP') {
        mitt.emitter.emit("graph_ip", evt.target.data());
      }
      if(evt.target.data('type') == 'Service') {
        mitt.emitter.emit("graph_service", evt.target.data());
      }
    });
    this.cyto.on('dblclick', (evt) => {
      mitt.emitter.emit("reset_all_panels");
      this.actionGraph("actualize");
    });
    this.loadStyle();
    console.log(this);
  },
  data() {
    return {
      // ici on ajoute les variables manipulables du graph
      rootColor : getComputedStyle(document.documentElement),
      cyto : {},
      options : {
        name: 'fcose', // cose est quand même pas mal...
        fit: true,  // Whether to fit the network view after when done
        padding: 30,
        animate: true, // TODO : l'animation est constante, mais la force n'est pas recalculé, trouvé un moyen pour que ça soit le cas
        animationDuration: 1000,
        animationEasing: 'ease-out',
        //infinite: 'end', // OW SHI__
        nodeDimensionsIncludeLabels: true, // OUUUIIIIII
        randomize: true, // ça semble mettre les noeud dans leur ordre d'arrivée, ça me plait.
        packComponents: true,
      },
      styles : [],
      layout : undefined,
      listLocalScanFunc : {
        'request_arp_scan' : this.getARPScan,
        'request_fast_ping' : this.getFastScan,
        'request_dhcp_cidr_scan' : this.getDHCP_CIDRScan,
        'request_traceroute_cidr_scan' : this.getTracerouteCIDRScan,
      },
      listMachineScanFunc :{
        'request_profiling_scan' : this.getProfilingScan,
        'request_reverse_ptr_scan' : this.getReversePTRScan,
        'request_fingerprint_ssh_scan' : this.getFingerprintSSHScan,
        'request_smb_scan' : this.getSMBScan,
        'request_snmp_scan' : this.getSNMPScan,
        'request_snmp_netstat_scan' : this.getSNMPnetstatScan,
        'request_snmp_process_scan' : this.getSNMPprocessScan,
        'request_ntp_scan' : this.getNTPScan,
        'request_rdp_scan' : this.getRDPScan,
        'request_trace_cible_scan' : this.getTraceCibleScan,
      },
      listMachinePortScanFunc :{
        'request_services_scan' : this.getServicesScan,
        'request_services_fast_scan' : this.getServicesFastScan,
      },
      listGlobalFunc : {
        'request_traceroute_local_scan' : this.getTracerouteLocalScan, 
        'request_traceroute_global_scan' : this.getTracerouteGlobalScan,
        'request_resolve_as_scan' : this.getResolveAS,
      },
    }
  },
    methods: {
      // fonction de création/mise à jour du thème
      loadStyle : function() {
        this.styles = [
          {
            selector: 'node',
            css: {
              'shape' : 'octagon',
              'color' : this.rootColor.getPropertyValue('--text2'),
              'background-color' : this.rootColor.getPropertyValue('--fond-noeuds'),
              'border-style' : 'none',
              'content': 'data(label)', // méga important, détermine quoi afficher comme donnée dans le label de noeud
              'text-outline-color': this.rootColor.getPropertyValue('--background-general'), 
              'text-outline-width' : 1,
              'text-valign': 'top',
              'text-halign': 'center',
              'opacity' : 1,
              'text-wrap': 'wrap',
              'background-fit' : 'contain',
              'font-family' : 'Hack',
              'z-index' : 10,
            },
          },
          {
            selector: 'node[type="note"]',
            css: {
              'shape' : 'round-rectangle',
              'text-valign': 'center',
              'text-halign': 'center',
              'text-wrap' : 'wrap',
              'font-size' : 8,
              'text-wrap': 'wrap',
              'text-max-width' : 260,
              'text-overflow-wrap' : 'whitespace',
              'text-justification' : 'auto',
              'width' : (node) => { return Math.min(260, node.data('label').length * 7) },
              'height' : (node) => { return (Math.floor(node.data('label').length/45) + 1) * 8 },
              'z-index' : 5,
            },
          },
          {
            selector: 'node[type="IP"]',
            css: {
              'background-image' : '/static/img/icone/ip_bg.png',
            },
          },
          {
            selector: 'node[type = "Service"]',
            css: {
              'width': '20px',
              'height': '20px',
              'background-image' : '/static/img/icone/service_bg.png',
            },
          },
          {
            selector: 'node[label*="gateway"]',
            css: {
              'background-image' : '/static/img/icone/gateway_bg.png',
            },
          },
          {
            selector: 'node[data.OS@="Windows"]',
            css: {
              'background-image' : '/static/img/icone/windows_bg.png',
            },
          },
          {
            selector: 'node[data.OS @*= "Linux"]',
            css: {
              'background-image' : '/static/img/icone/linux_bg.png',
            },
          },
          {
            selector: 'node[data.OS @= "Unknown"]',
            css: {
              'background-image' : '/static/img/icone/unknown_bg.png',
            },
          },
          {
            selector: 'node[data.OS @*= "Android"]',
            css: {
              'background-image' : '/static/img/icone/android_bg.png',
            },
          },
          {
            selector: 'node[data.OS @*= "Mac OS X"]',
            css: {
              'background-image' : '/static/img/icone/mac_bg.png',
            },
          },
          {
            selector: 'node[data.OS @*= "BSD"]',
            css: {
              'background-image' : '/static/img/icone/freebsd_bg.png',
            },
          },
          {
            selector: ':parent',
            css: {
              'text-valign': 'top',
              'text-halign': 'center', 
              'background-opacity': '0',
              'z-index' : -5,
            },
          },
          {
            selector: 'node:selected',
            css: {
              'border-width' : 2,
              'border-style' : 'solid',
              'border-color' : this.rootColor.getPropertyValue('--widget-background1'), 
              'ghost' : 'yes',
              "ghost-offset-y": 1,
              'ghost-opacity': 0.4,
            },
          },
          {
            selector: 'edge',
            css: {
              'line-color' : this.rootColor.getPropertyValue('--widget-background3'),
              'target-arrow-color' : this.rootColor.getPropertyValue('--widget-strong-contour1'), 
              'curve-style': 'bezier',
              'target-arrow-shape': 'triangle',
              'opacity' : 0.5,
            },
          },
          {
            selector: 'edge[typelink = "upstream"]',
            css: {
              'line-color' : this.rootColor.getPropertyValue('--widget-strong-contour2'),
              'target-arrow-color' : this.rootColor.getPropertyValue('--widget-strong-contour1'), 
              'width': 4, // épaisseur de l'edge sélectionné
              'opacity' : 0.8,
            },
          },
        ];
        this.cyto.style(this.styles);
      },
      //// fonctions de scan local
      // fonctions de récupération de donnée scan ARP
      getARPScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan ARP");
        axios({
          method : 'POST',
          url : '/json/arp_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "réception d'un scan ARP");
          // on appel la fonction de création de graphs :
          this.createCytoVlanGraph(response.data);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
          console.log(error);
        })
      },
      // fonctions de récupérations de donnée Fast Scan (ICMP ping)
      getFastScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan FastPing");
        axios({
            method : 'POST',
            url : '/json/fast_scan',
            headers: {'Content-Type': 'application/json'},
            data : {'cible' : cible},
          }).then((response) => {
            // si la requête passe :
            mitt.emitter.emit('echo_toast_scan', "réception d'un scan FastPing");
            // on appel la fonction de création de graphs :
            this.createCytoVlanGraph(response.data);
          }).catch((error) => {
            // si la requête échoue :
            mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
            console.log(error);
          }
        );
      },
      // fonction d'obtention d'IP du réseau local via DHCP scan sur CIDR
      getDHCP_CIDRScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan DHCP CIDR");
        axios({
          method : 'POST',
          url : '/json/dhcp_cidr_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "réception d'un scan DHCP CIDR");
          // on appel la fonction de création de graphs :
          this.createCytoCIDRGraph(response.data, cible);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
          console.log(error);
        });
      },
      // fonction d'obtention d'IP du réseau local (ou opérateur) via traceroute CIDR
      getTracerouteCIDRScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan Traceroute CIDR");
        axios({
          method : 'POST',
          url : '/json/trace_cidr_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "réception d'un scan Traceroute CIDR");
          // on appel la fonction de création de graphs :
          this.createCytoTraceCIDRGraph(response.data);
        }).catch((error) => {
        // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
          console.log(error);
        });
      },

      // fonction de scan machine
      // fonctions de profiling machine (OS, device, ...)
      getProfilingScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan profiling");
        axios({
          method : 'POST',
          url : '/json/profiling_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :          
          mitt.emitter.emit('echo_toast_scan', "Réception scan profiling");
          // on met à jour le node concerné via une fonction de sélection de node
          this.updateNodebyIP(cible, 'profiling', response.data['scan']);
          this.updateNodeOS(cible, response.data['scan']);
        }).catch((error) => {
          mitt.emitter.emit('echo_toast_scan', "Erreur scan profiling");
          console.log(error);
        });
      },
      // fonction d'obtention du hostname par requête DNS reverse PTR sur cible
      getReversePTRScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan PTR");
        axios({
          method : 'POST',
          url : '/json/reverse_ptr_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "Réception scan PTR");
          // on met à jour le node concerné via une fonction de sélection de node
          this.updateNodebyIP(cible, 'hostname PTR', response.data['scan']);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan', "Erreur scan PTR");
          console.log(error);
        });
      },
      // fonction d'obtention de fingerprint SSH par requête SSH sur cible
      getFingerprintSSHScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan fingerprint SSH");
        axios({
          method : 'POST',
          url : '/json/fingerpting_ssh_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "Réception scan fingerprint SSH");
            // on met à jour le node concerné via une fonction de sélection de node
            this.updateNodebyIP(cible, 'fingerprint ssh', response.data['scan']);
          },
          // si la requête échoue :
          function(error) {
            mitt.emitter.emit('echo_toast_scan', "Erreur scan fingerprint SSH");
            console.log(error);
          }
        );
      },
      // fonction d'obtention d'info sur un SMB share
      getSMBScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan SMB");
        axios({
          method : 'POST',
          url : '/json/scan_info_smb',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :          
          mitt.emitter.emit('echo_toast_scan', "Réception scan SMB");
          // on met à jour le node concerné via une fonction de sélection de node
          this.updateNodebyIP(cible, 'smb', response.data['scan']);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan', "Erreur scan SMB");
          console.log(error);
        });
      },
      // fonction d'obtention d'info sur une entrée SNMP
      getSNMPScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan SNMP");
        axios({
          method : 'POST',
          url : '/json/scan_snmp_info',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "Réception scan SNMP");
          // on met à jour le node concerné via une fonction de sélection de node
          this.updateNodebyIP(cible, 'snmp_info', response.data['scan']);
        }).catch((error) => {
        // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan', "Erreur scan SNMP");
          console.log(error);
        });
      },
      // fonction d'obtention d'info sur une entrée SNMP netstat
      getSNMPnetstatScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan SNMP netstat");
        axios({
          method : 'POST',
          url : '/json/scan_snmp_netstat',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :          
          mitt.emitter.emit('echo_toast_scan', "Réception scan SNMP netstat");
          // on met à jour le node concerné via une fonction de sélection de node
          this.updateNodebyIP(cible, 'snmp_nestat', response.data['scan']);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan', "Erreur scan SNMP netstat");
          console.log(error);
        });
      },
      // fonction d'obtention d'info sur une entrée SNMP getprocess
      getSNMPprocessScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan SNMP process");
        axios({
          method : 'POST',
          url : '/json/scan_snmp_processes',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :      
          mitt.emitter.emit('echo_toast_scan', "Lancement scan SNMP process");
          // on met à jour le node concerné via une fonction de sélection de node
          this.updateNodebyIP(cible, 'snmp_process', response.data['scan']);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan', "Lancement scan SNMP process");
          console.log(error);
        });
      },
      // fonction d'obtention d'info en NTP
      getNTPScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan NTP");
        axios({
          method : 'POST',
          url : '/json/scan_ntp',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :          
          mitt.emitter.emit('echo_toast_scan', "Réception scan NTP");
          // on met à jour le node concerné via une fonction de sélection de node
          this.updateNodebyIP(cible, 'ntp', response.data['scan']);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan', "Erreur scan NTP");
          console.log(error);
        });
      },
      // fonction d'obtention d'info sur un RDP
      getRDPScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan RDP");
        axios({
          method : 'POST',
          url : '/json/scan_rdp_info',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "Réception scan RDP");
          // on met à jour le node concerné via une fonction de sélection de node
          this.updateNodebyIP(cible, 'rdp_info', response.data['scan']);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan', "Erreur scan RDP");
          console.log(error);
        });
      },
      // fonction d'obtention d'info via traceroute
      getTraceCibleScan : function(cible) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan trace");
        axios({
          method : 'POST',
          url : '/json/trace_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :          
          mitt.emitter.emit('echo_toast_scan', "Réception scan trace");
          // on met à jour le node concerné via une fonction de sélection de node
          this.createCytoTraceGraph(response.data);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan', "Erreur scan trace");
          console.log(error);
        });
      },
      // fonctions de listage des services machine (par port)
      getServicesScan : function(cible, pstart, pend) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan Services custom");
        axios({
          method : 'POST',
          url : '/json/services_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible, 'port_start' : pstart, 'port_end' : pend},
        }).then((response) => {
          // si la requête passe :          
          mitt.emitter.emit('echo_toast_scan', "Réception scan Services custom");
          // on met à jour le graph en ajoutant des noeuds type service lié à la cible
          this.createCytoServiceGraph(response.data['scan']);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan', "Erreur scan Services custom");
          console.log(error);
        });
      },
      // fonctions de listage des services machine (par port)
      getServicesFastScan : function(cible, pstart, pend) {
        mitt.emitter.emit('echo_toast_scan', "Lancement scan Services Fast");
        axios({
          method : 'POST',
          url : '/json/services_fast_scan',
          headers: {'Content-Type': 'application/json'},
          data : {'cible' : cible},
        }).then((response) => {
          // si la requête passe :
          mitt.emitter.emit('echo_toast_scan', "Réception scan Services Fast");
          // on met à jour le graph en ajoutant des noeuds type service lié à la cible
          this.createCytoServiceGraph(response.data['scan']);
        }).catch((error) => {
          // si la requête échoue :
          mitt.emitter.emit('echo_toast_scan', "Erreur scan Services Fast");
          console.log(error);
        });
      },

      //// fonctions du menu de découverte général
      // fonction d'obtention d'IP des réseaux locaux via traceroute
      getTracerouteLocalScan : function() {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan traceroute local");
        let list_local_cidr = [
            "0.0.0.0/8", 
            "100.64.0.0/10",
            "127.0.0.0/8", 
            "169.254.0.0/16", 
            "192.0.0.0/24", 
            "192.0.2.0/24", 
            "192.88.99.0/24",
            "192.175.48.0/24",
            "198.18.0.0/15", 
            "198.51.100.0/24", 
            "203.0.113.0/24",
            "224.0.0.0/4", 
            "233.252.0.0/24",
            "240.0.0.0/4", 
            "255.255.255.255/32",
        ];
        list_local_cidr.forEach((cidr, index) => {
          let interval = 5000; // 5 secondes entre chaque scan
          setTimeout(() => {
            axios({
              method : 'POST',
              url : '/json/trace_cidr_scan',
              headers: {'Content-Type': 'application/json'},
              data : {'cible' : cidr},
            }).then((response) => {
              // si la requête passe :              
              mitt.emitter.emit('echo_toast_scan', "réception d'un scan Traceroute Local");
              // on appel la fonction de création de graphs :
              this.createCytoTraceCIDRGraph(response.data);
            }).catch((error) => {
            // si la requête échoue :
              mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
              console.log(error);
            }
            );
          }, index * interval);
        });
      },
      // fonction d'obtention d'IP du réseau (via rootserver opérateur) via traceroute
      getTracerouteGlobalScan : function() {
        mitt.emitter.emit('echo_toast_scan', "lancement d'un scan Traceroute CIDR");
        let list_root_server_ip =  [
          "198.41.0.4",
          "199.9.14.201",
          "192.33.4.12",
          "199.7.91.13",
          "192.203.230.10",
          "192.5.5.241",
          "192.112.36.4",
          "198.97.190.53",
          "192.36.148.17",
          "192.58.128.30",
          "193.0.14.129",
          "199.7.83.42",
          "202.12.27.33",
        ];
        list_root_server_ip.forEach((cible, index) => {
          let interval = 5000; // 5 secondes entre chaque scan
          setTimeout(() => {
            axios({
              method : 'POST',
              url : '/json/trace_scan',
              headers: {'Content-Type': 'application/json'},
              data : {'cible' : cible},
            }).then((response) => {
              // si la requête passe :              
              mitt.emitter.emit('echo_toast_scan', "réception d'un scan Traceroute CIDR");
              // on appel la fonction de création de graphs :
              this.createCytoTraceGraph(response.data);
            }).catch((error) => {
              // si la requête échoue :
              mitt.emitter.emit('echo_toast_scan_error', "erreur : " + error);
              console.log(error);
            });
          }, index * interval);
        });
      },

      // fonction d'assignation des signaux aux fonctions adéquats
      receiveEmitRequestLocalScan : function(args) {
        this.listLocalScanFunc[args.type](args.cible);
      },
      receiveEmitRequestMachineScan : function(args) {
        if(Array.isArray(args.cible)) {
          args.cible.forEach((cible) => {
            this.listMachineScanFunc[args.type](cible);
          })
        }else {
          this.listMachineScanFunc[args.type](args.cible);
        }
      },
      receiveEmitRequestMachinePortScan : function(args) {
        if(Array.isArray(args.cible)) {
          args.cible.forEach((cible) => {
            this.listMachinePortScanFunc[args.type](cible, args.port_start, args.port_end);
          })
        }else {
          this.listMachinePortScanFunc[args.type](args.cible, args.port_start, args.port_end);
        }
      },
      receiveEmitRequestGeneralScan : function(args) {
        this.listGlobalFunc[args.type]();
      },

      //// fonction de rendu du graph en fonction pour les scan locaux
      // fonction de création du graph à partir d'un scan CIDR normal
      createCytoVlanGraph : function(scan_data) {
        let nodes = [];
        let edges = [];
        //ajout de la représentation du VLAN
        nodes.push(
          {
            group:'nodes',
            data: {
              id : scan_data.vlan,
              label : scan_data.vlan,
              type : 'VLAN',
            },
          }
        );

        // ajout du routeur gateway
        nodes.push(
          {
            group:'nodes',
            data: {
              id : (scan_data.local_data.gateway_ip + '\n' + scan_data.local_data.gateway_mac),
              label : ("gateway " + scan_data.local_data.gateway_ip + "\n" + scan_data.local_data.gateway_mac),
              type : 'IP',
              typeip: ipaddr.parse(scan_data.local_data.gateway_ip).range(),
              data : scan_data.local_data,
              data_ip : scan_data.local_data.gateway_ip,
              parent : scan_data.vlan,
            },
          }
        );

        // ajout des entités nmap :
        scan_data.scan.forEach(function(nodeAdd) {
          if(nodeAdd.IP != scan_data.local_data[2]) {
            nodes.push(
              {
                group:'nodes',
                data: {
                  id : (nodeAdd.IP + '\n' + nodeAdd.mac),
                  label : (nodeAdd.IP + '\n' + nodeAdd.mac),
                  type : 'IP',
                  typeip : ipaddr.parse(nodeAdd.IP).range(),
                  data : nodeAdd,
                  data_ip : nodeAdd.IP,
                  parent : scan_data.vlan,
                },
              }
            );
          }
        });

        // liaison de l'ensemble des entités nmap à la gateway : 
        let gateway_id = (scan_data.local_data.gateway_ip + '\n' + scan_data.local_data.gateway_mac);
        nodes.forEach(function(nodeI) {
          if((nodeI.data.type == 'IP') && (nodeI.data.id != gateway_id)) { // on évite de créer un lien entre autre chose qu'une IP et la gateway
            edges.push(
              {
                group:'edges',
                data : {
                  id : ('link ' + gateway_id + " " + nodeI.data.id + " "),
                  source : nodeI.data.id,
                  target : (scan_data.local_data.gateway_ip + '\n' + scan_data.local_data.gateway_mac),
                  type: 'IPtoVLAN',
                  parent : scan_data.vlan,
                }
              }
            );
          }
        });

        // on ajoute l'ensemble des ip au graph
        this.cyto.add(nodes);
        // on ajoute l'ensemble des lien au graph
        this.cyto.add(edges);
        // on actualise la vue
        this.layout = this.cyto.layout(this.options);
        this.layout.run();
      },
      // fonction de création du graph à partir d'un scan CIDR normé (par exemple DHCP)
      createCytoCIDRGraph : function(scan_data, cidr) {
        if(scan_data.scan.length == 0) { // on vérifie qu'on a pas juste un scan vide
          mitt.emitter.emit('echo_toast_scan_error', "erreur : Scan reçu vide" );
          return;
        }
        // on commence la création de la vue graphe
        let nodes = [];
        let edges = [];
        //ajout de la représentation du VLAN
        nodes.push(
          {
            group:'nodes',
            data: {
              id : cidr,
              label : cidr,
              type : 'VLAN',
            },
          }
        );

        // ajout des entités nmap :
        scan_data.scan.forEach(function(nodeAdd) {
          if(nodeAdd.mac != undefined) { nodeAdd.mac = nodeAdd.mac.toLowerCase(); };
          nodes.push(
            {
              group:'nodes',
              data: {
                id : (nodeAdd.ipv4 + '\n' + nodeAdd.mac),
                label : (nodeAdd.ipv4 + '\n' + nodeAdd.mac),
                type : 'IP',
                typeip : ipaddr.parse(nodeAdd.ipv4).range(),
                data : nodeAdd,
                data_ip : nodeAdd.ipv4,
                parent : cidr,
              },
            }
          );
        });

        // on ajoute l'ensemble des ip au graph
        this.cyto.add(nodes);
        // on ajoute l'ensemble des lien au graph
        this.cyto.add(edges);
        // on actualise la vue
        this.layout = this.cyto.layout(this.options);
        this.layout.run();
      },
      // fonction de création du graph à partir d'un scan trace CIDR
      createCytoTraceCIDRGraph : function(scan_data) {
        scan_data.scan.forEach((trace) => { // l'arnaque se situe ici (vous avez cru quoi ? que j'allais tout recoder ?)
          this.createCytoTraceGraph({'scan': trace});
        });
      },
      
      // fonction de rendu du graph pour les scans plus orientés IP/services
      // fonction de création du graph à partir d'un scan trace
      createCytoTraceGraph : function(scan_data) {
        let nodes = [];
        let edges = [];

        // on ajoute les noeuds
        scan_data.scan.forEach((ipdata) => {
          let ip = ipdata[0];
          // on récupère le node déjà créé avec l'ip associé : 
          let node_exist = this.cyto.elements('node[data_ip = "' + ip + '"]');
          if(node_exist.length == 0) { // cas où le noeud est à créer
            nodes.push(
              {
                group:'nodes',
                data: {
                  id : (ip),
                  label : (ip),
                  type : 'IP',
                  typeip : ipaddr.parse(ip).range(),
                  data : {'ip' : ip},
                  data_ip : ip,
                  parent : this.getVLANByIP(ip), // a retravailler : on doit préalablement voir si le noeud rentre dans le CIDR...
                },
              }
            );
          }else { // cas où le noeud existe déjà

          }
        });

        // on ajoute l'ensemble des ip au graph
        this.cyto.add(nodes);

        // on ajoute les liens si possible
        for(let key in scan_data.scan){
          if(key == 0) {
          }else {
            let id_last_node = this.getNodeIdByIP(scan_data.scan[key-1][0]);
            let id_node = this.getNodeIdByIP(scan_data.scan[key][0]);
            let last_node_typeip = ipaddr.parse(id_last_node.split('\n')[0]).range();
            let node_typeip = ipaddr.parse(id_node.split('\n')[0]).range();
            if((last_node_typeip == 'private' & node_typeip != 'private') |
            (last_node_typeip != 'private' & node_typeip == 'private')
            ){
              edges.push({
                group:'edges',
                data : {
                  id : ('link ' + id_last_node + " " + id_node + " "),
                  source : id_last_node,
                  target : id_node,
                  type : 'traceroute',
                  typelink : 'upstream',
                }
              });
            }else {
              edges.push({
                group:'edges',
                data : {
                  id : ('link ' + id_last_node + " " + id_node + " "),
                  source : id_last_node,
                  target : id_node,
                  type : 'traceroute',
                }
              });
            }
          }
        }

        // on ajoute l'ensemble des lien au graph
        this.cyto.add(edges);
        // on actualise la vue
        this.layout = this.cyto.layout(this.options);
        this.layout.run();

        // on va maintenant lier les données aux AS 
        // NOTE : c'est une opération longue, si on parviens à la réduire à un temps raisonnable,
        // le code sera à fusionner avec le code d'au dessus...
        scan_data.scan.forEach((ipdata) => {
          let nodeAS = [];
          let nodeVlan = [];
          let ip = ipdata[0];
          let cidr = ipdata[1][0];
          let as_number = ipdata[1][1];
          let typeip = ipaddr.parse(ip).range();
          if((typeip != 'private') && (typeip != 'multicast')) {
            // on crée un AS
            nodeAS.push(
              {
                group:'nodes',
                data: {
                  id : as_number,
                  label : as_number,
                  type : 'AS',
                },
              }
            );
            // on crée un VLAN
            nodeVlan.push(
              {
                group:'nodes',
                data: {
                  id : cidr,
                  label : cidr,
                  type : 'VLAN',
                  parent: as_number,
                },
              }
            );
          }
          // on ajoute l'ensemble des VLAN + AS au graph
          this.cyto.add(nodeAS);
          this.cyto.add(nodeVlan);
          // on ajoute l'ID du node audit VLAN
          this.cyto.$('#' + this.getNodeIdByIP(ip)).move({parent : this.getVLANByIP(ip)});
        });
        // on actualise la vue
        this.layout = this.cyto.layout(this.options);
        this.layout.run();
      },
      // fonction de création du graph à partir d'un scan d'une IP ressortant les services
      createCytoServiceGraph : function(scan_data) {
        // on crée les listes de noeuds/liens qu'on va pousser dans le graph
        let nodes_services = [];
        let edges_services = [];

        scan_data.forEach((ip_scanned) => {
            // on cherche le noeud auquel rattacher les services
          let node_update = this.cyto.elements("node[data_ip = '" + ip_scanned.IP + "']");
          // on crée les noeuds de type services associés au noeud IP
          if(node_update.length != 0) { // on vérifie qu'on a trouvé l'IP (on sais jamais)
            // on accède aux données listés 
            let id_node = (ip_scanned.IP + ':' + ip_scanned.port + ' ' + ip_scanned.result.cpe);
            let label_node = ip_scanned.port + ' ' + ip_scanned.result.product;
            if(ip_scanned.result.product == "") {
              label_node = ip_scanned.port + ' ' + ip_scanned.result.name;
            }
            nodes_services.push(
              {
                group:'nodes',
                data: {
                  id : id_node,
                  label : label_node,
                  type : 'Service',
                  data : ip_scanned.result,
                  data_ip : ip_scanned.IP,
                  parent : node_update.data('parent'),
                },
              }
            );
            edges_services.push(
              {
                group:'edges',
                data : {
                  id : ('link ' + node_update.data('id') + " " + id_node + " "),
                  source : node_update.data('id'),
                  target : id_node,
                  type: 'ServicetoIP',
                  parent : node_update.data('parent'),
                }
              }
            );
          }
        });
        // on ajoute l'ensemble des services au graph
        this.cyto.add(nodes_services);
        // on ajoute l'ensemble des lien au graph
        this.cyto.add(edges_services);
        // on actualise la vue
        this.layout = this.cyto.layout(this.options);
        this.layout.run();
      },
      
      //// fonction utiles de manipulation du graph et des éléments réseau
      // fonction de mise à jour d'un noeud spécifique
      updateNodebyIP : function(ip_node, update_key, update_data) {
        // on cherche le noeud à updater par IP
        let node_update = this.cyto.elements("node[data_ip = '" + ip_node + "']");
        // on met la donnée dans la key du node depuis data
        if(node_update.length != 0) {
          node_update.data('data')[update_key] = update_data;
        }
        console.log(node_update);
      },
      //fonction d'ajout du profiling à l'OS
      updateNodeOS : function(ip_node, profiling_data) {
        let node_update = this.cyto.elements("node[data_ip = '" + ip_node + "']");
        // on vérifie que le noeud existe avant d'y ajouter des choses
        if(node_update.length != 0) {
          node_update.data('data')['OS'] = profiling_data.osfamily;
        }
      },
      // fonction de récupération d'un ID de node via une recherche par IP
      getNodeIdByIP : function(ip) {
        return this.cyto.elements('node[data_ip = "' + ip + '"]').data('id');
      },
      // Fonction de récupération d'un VLAN via une recherche par IP
      getVLANByIP : function(ip) {
        let listVLAN = [];
        this.cyto.elements('node[type = "VLAN"]').forEach(function(node) {
          listVLAN.push(node.data('id').split('/'));
        });

        // on trie les subnet par ordre de taille 
        listVLAN.sort(function(a, b){return b[1] - a[1]});
        
        // maintenant, on doit comparer IP / range d'IP et le premier match renvoie son ID
        for (const element of listVLAN) {
          if(ipaddr.parse(ip).match(ipaddr.parse(element[0]), element[1])) {
            return element[0] + "/" + element[1];
          }
        }
      },
      // fonction de complétion des ASN avec leur vrai noms :
      getResolveAS : function() {
        this.cyto.elements('node[type = "AS"]').forEach(function(node) {
          if(node.data('as_resolution')){
            return; // si la résolution à déjà été faite, on s'épargne de la refaire
          }
          // si il s'agit d'un multi-origin AS set, on fait deux requêtes, sinon une seule
          if(node.data('label').includes('_')){
            let list_asn = node.data('label').split('_');
            // on crée deux requêtes
            let req1 = {
              method : 'GET',
              url : 'https://rdap.arin.net/registry/autnum/' + list_asn[0],
              headers: {'Content-Type': 'application/rdap+json'},
            };
            let req2 = {
              method : 'GET',
              url : 'https://rdap.arin.net/registry/autnum/' + list_asn[1],
              headers: {'Content-Type': 'application/rdap+json'},
            };

            // on récupère les info d'AS
            axios(req1).then((response) => {
                // si la requête passe :
                $scope.$parent.sendToastData('AS Resolution', "Récupération de donnée RDAP", 'echo_toast_scan');
                // on les fout dans le label du noeud
                if(node.data('label').includes(' ')) {
                  node.data('label', node.data('label') + " & " + response.data.name);
                } else{
                  node.data('label', node.data('label') + " " + response.data.name);
                }
                // on spécifie que la résolution a été effectué
                node.data('as_resolution', true);
              }).catch((error) => {
                // si la requête échoue :
                $scope.$parent.sendToastData('AS Resolution', "erreur : " + error, 'echo_toast_error');
                console.log(error);
              });

            // on récupère les info d'AS
            axios(req2).then((response) => {
              // si la requête passe :
              $scope.$parent.sendToastData('AS Resolution', "Récupération de donnée RDAP", 'echo_toast_scan');
              // on les fout dans le label du noeud
              if(node.data('label').includes(' ')) {
                node.data('label', node.data('label') + " & " + response.data.name);
              } else{
                node.data('label', node.data('label') + " " + response.data.name);
              }
              // on spécifie que la résolution a été effectué
              node.data('as_resolution', true);
            }).catch((error) => {
              // si la requête échoue :
              $scope.$parent.sendToastData('AS Resolution', "erreur : " + error, 'echo_toast_error');
              console.log(error);
            });

          }else {
            // on crée une requête
            let req = {
              method : 'GET',
              url : 'https://rdap.arin.net/registry/autnum/' + node.data('label'),
              headers: {'Content-Type': 'application/rdap+json'},
            };
            // on récupère les info d'AS
            axios(req).then((response) => {
              // si la requête passe :
                $scope.$parent.sendToastData('AS Resolution', "Récupération de donnée RDAP", 'echo_toast_scan');
                // on les fout dans le label du noeud
                node.data('label', node.data('label') + " " + response.data.name);
                // on spécifie que la résolution a été effectué
                node.data('as_resolution', true);
              }).catch((error) => {
              // si la requête échoue :
                $scope.$parent.sendToastData('AS Resolution', "erreur : " + error, 'echo_toast_error');
                console.log(error);
              });
          }
        });
      },
      // fonction de création d'une image PNG du graph
      getCytoPNG : function() {
        this.cyto.png({output : 'blob-promise'}).then(function(data) {
          let element = document.createElement('a');
          element.setAttribute('href', window.URL.createObjectURL(data));
          element.setAttribute('download', "graph.png");
          element.style.display = 'none';
          document.body.appendChild(element);
        
          element.click();
        
          document.body.removeChild(element);
        }).catch(function(error ) {
          console.log(error);
        });
      },

      getCytoJPG : function() {
        this.cyto.jpg({output : 'blob-promise'}).then(function(data) {
          let element = document.createElement('a');
          element.setAttribute('href', window.URL.createObjectURL(data));
          element.setAttribute('download', "graph.jpg");
          element.style.display = 'none';
          document.body.appendChild(element);
        
          element.click();
        
          document.body.removeChild(element);
        }).catch(function(error ) {
          console.log(error);
        });
      },

      getCytoJSON : function() {
        let element = document.createElement('a');
        element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.cyto.json())));
        element.setAttribute('download', "graph.json");
        element.style.display = 'none';
        document.body.appendChild(element);
      
        element.click();
      
        document.body.removeChild(element);
      },
      // fonction d'export du graph en différents formats : 
      exportGraph : function(typeexport) {
        if(typeexport == "png") { this.getCytoPNG(); };
        if(typeexport == "jpg") { this.getCytoJPG(); };
        if(typeexport == "json") { this.getCytoJSON(); };
      },
      // fonction insérant du json uploadé dans le graph
      setCytoJSON : function(param_json) {
        this.cyto.json(param_json);
      },
      // fonction exécutant une action sur le graph demandé par une autre app vuejs
      actionGraph : function(action) {
        if(action == "actualize") {
          this.layout = this.cyto.layout(this.options);
          this.layout.run();
        }
        if(action == "delete_selection") {
          this.cyto.elements('node:selected').remove();
        }
        if(action == "get_selected") {
          let list_ip = [];
          this.cyto.elements('node[type="IP"]:selected').forEach(function(node) {
            list_ip.push(node.data('data_ip'));
          });
          mitt.emitter.emit("send_selected_ip", list_ip);
        }
      },
  },
});