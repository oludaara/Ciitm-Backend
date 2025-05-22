import express from 'express';
const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Returns a list of users
 *     description: Optional extended description
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The user ID.
 *                     example: 1
 *                   name:
 *                     type: string
 *                     description: The user's name.
 *                     example: Leanne Graham
 */
router.get('/', (req, res) => {
  // Your route logic here
  // TODO: Implement logic to fetch and return a list of users
  res.status(501).send('Not Implemented');
});

export default router; 