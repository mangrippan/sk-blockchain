/**
 * System Routes
 * /api/v1/system
 */

'use strict';

const express = require('express');
const router = express.Router();
const fabricClient = require('../../utils/fabricClient');
const { auth } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System health and status endpoints
 */

/**
 * @swagger
 * /api/v1/system/status:
 *   get:
 *     summary: Get system and blockchain connection status
 *     description: Returns current status of the server, database, and Hyperledger Fabric network connection. Requires authentication.
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 server:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     uptime:
 *                       type: number
 *                 blockchain:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     connected:
 *                       type: boolean
 *                     identity:
 *                       type: string
 *                       nullable: true
 *                       example: appUser
 *                     channel:
 *                       type: string
 *                       example: primachannel
 *                     chaincode:
 *                       type: string
 *                       example: prima
 *                     connectedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 */
router.get('/status', auth, (req, res) => {
  const blockchainStatus = fabricClient.getConnectionStatus();

  res.json({
    server: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    blockchain: blockchainStatus,
  });
});

module.exports = router;
