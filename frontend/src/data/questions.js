// Illustrative questions for the UI prototype; these are not an official IELTS question bank.
export const questionBank = [
  {
    id: 'task1-students',
    task: 1,
    topic: 'Education',
    title: 'International students',
    question:
      'The bar chart below shows the number of international students in four countries between 2010 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    visual: 'students-chart',
  },
  {
    id: 'task1-energy',
    task: 1,
    topic: 'Environment',
    title: 'Renewable electricity',
    question:
      'The bar chart below compares the percentage of electricity generated from renewable sources in four countries in selected years.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    visual: 'energy-chart',
  },
  {
    id: 'task2-transport',
    task: 2,
    topic: 'Transport',
    title: 'Public and private transport',
    question:
      'Some people believe that governments should invest more money in public transport, while others think that funds should be spent on improving roads for private cars.\n\nDiscuss both views and give your own opinion.',
    visual: null,
  },
  {
    id: 'task2-education',
    task: 2,
    topic: 'Education',
    title: 'University education',
    question:
      'Some people think universities should focus on preparing students for employment, while others believe that university education should mainly develop knowledge and critical thinking.\n\nDiscuss both views and give your opinion.',
    visual: null,
  },
  {
    id: 'task2-environment',
    task: 2,
    topic: 'Environment',
    title: 'Environmental responsibility',
    question:
      'Some people argue that individuals can do little to improve the environment, whereas others believe individual actions can make a significant difference.\n\nDiscuss both views and give your opinion.',
    visual: null,
  },
]

export const questionsFor = (task) => questionBank.filter((item) => item.task === task)

export const defaultQuestion = (task) =>
  questionBank.find((item) => item.task === task) ?? questionBank[0]

export const wordCount = (text) => (text.trim().match(/\S+/g) || []).length
export const formatTime = (totalSeconds) => {
  const safe = Math.max(0, Number(totalSeconds) || 0)
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}
