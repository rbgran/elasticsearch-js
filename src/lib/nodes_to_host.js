const _ = require('./utils');

const extractHostPartsRE1x = /\[(?:(.*)\/)?(.+?):(\d+)\]/;

function makeNodeParser(hostProp) {
  return function (nodes) {
    return _.transform(nodes, function (hosts, node, id) {
      let address = _.get(node, hostProp);
      if (!address) return;

      const host = {
        host: undefined,
        port: undefined,
        _meta: {
          id: id,
          name: node.name,
          version: node.version
        }
      };

      const malformedError = new Error(
        'Malformed ' + hostProp + '.' +
        ' Got ' + JSON.stringify(address) +
        ' and expected it to match "{hostname?}/{ip}:{port}".'
      );

      const matches1x = extractHostPartsRE1x.exec(address);
      if (matches1x) {
        host.host = matches1x[1] || matches1x[2];
        host.port = parseInt(matches1x[3], 10);
        hosts.push(host);
        return;
      }

      if (address.indexOf('/') > -1) {
        const withHostParts = address.split('/');
        if (withHostParts.length !== 2) throw malformedError;

        host.host = withHostParts.shift();
        address = withHostParts.shift();
      }

      if (address.indexOf(':') < 0) {
        throw malformedError;
      }

      const addressParts = address.split(':');
      if (addressParts.length !== 2) {
        throw malformedError;
      }

      host.host = host.host || addressParts[0];
      host.port = parseInt(addressParts[1], 10);
      hosts.push(host);
    }, []);
  };
}

module.exports = makeNodeParser('http.publish_address');
