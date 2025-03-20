import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// Inicializa Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const server = express();

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' });
const preference = new Preference(client);
const payment = new Payment(client);

server.use(cors());
server.use(express.json());

// Rota para criar preferência de pagamento
server.post('/api/payment/create-preference', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Verifica se o usuário existe
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Cria a preferência de pagamento
    const preferenceData = {
      items: [
        {
          id: '1',
          title: 'Assinatura Wise Sales',
          unit_price: Number(amount),
          quantity: 1,
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: userDoc.data().name || '',
        email: userDoc.data().email || '',
      },
      back_urls: {
        success: `${process.env.VITE_APP_URL}/configuracoes/assinatura?status=success`,
        failure: `${process.env.VITE_APP_URL}/configuracoes/assinatura?status=failure`,
        pending: `${process.env.VITE_APP_URL}/configuracoes/assinatura?status=pending`
      },
      auto_return: "approved",
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 1
      },
      notification_url: `${process.env.VITE_APP_URL}/api/payment/webhook`,
      external_reference: userId
    };

    const response = await preference.create({ body: preferenceData });
    res.json({ checkoutUrl: response.init_point });
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({ error: 'Erro ao criar preferência de pagamento' });
  }
});

// Rota para webhook do Mercado Pago
server.post('/api/payment/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      const paymentId = String(data.id);
      const paymentData = await payment.get({ id: paymentId });
      
      if (!paymentData.external_reference) {
        throw new Error('External reference não encontrada');
      }

      const userId = paymentData.external_reference;

      if (paymentData.status === 'approved') {
        // Atualiza o status da assinatura no Firestore
        const paymentRef = doc(db, 'payments', userId);
        const now = new Date();
        const subscriptionEnd = new Date();
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

        await setDoc(paymentRef, {
          lastPaymentDate: now.toISOString(),
          subscriptionEndsAt: subscriptionEnd.toISOString(),
          status: 'active',
          paymentId
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
