/**
 * Models Index
 * Central export for all models
 */

const User = require('./User');
const Kegiatan = require('./Kegiatan');
const Usulan = require('./Usulan');
const RefKegiatan = require('./RefKegiatan');

module.exports = {
  User,
  Kegiatan,
  Usulan,
  RefKegiatan,
};
