const { withFieldBuild } = require('./tools/native-field/field-config.cjs');
module.exports = ({ config }) => withFieldBuild(config, 'public');
