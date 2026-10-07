import { Corpus } from '../models/game.models';

export const CORPUS_MOCK: Corpus = {
  preguntas: [
    {
      id: 1,
      pregunta: '¿Qué hace un politécnico entre clases?',
      respuestas: [
        { texto: 'Ir a la cafetería', puntos: 32 },
        { texto: 'Estudiar en la biblioteca', puntos: 24 },
        { texto: 'Hacer trabajos en grupo', puntos: 18 },
        { texto: 'Conversar con amigos', puntos: 14 },
        { texto: 'Revisar el celular', puntos: 8 },
        { texto: 'Dormir', puntos: 4 },
      ],
    },
    {
      id: 2,
      pregunta: 'Menciona algo que no puede faltar en una mochila politécnica',
      respuestas: [
        { texto: 'Laptop', puntos: 35 },
        { texto: 'Calculadora', puntos: 27 },
        { texto: 'Cargador', puntos: 18 },
        { texto: 'Cuaderno', puntos: 12 },
        { texto: 'Botella de agua', puntos: 8 },
      ],
    },
    {
      id: 3,
      pregunta: 'Una excusa común para entregar un trabajo tarde',
      respuestas: [
        { texto: 'Se me cayó el internet', puntos: 40 },
        { texto: 'Se dañó mi computadora', puntos: 30 },
        { texto: 'Me enfermé', puntos: 20 },
        { texto: 'Se me olvidó', puntos: 10 },
      ],
    },
  ],
};