'use client';

import { useState } from 'react';

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="w-full py-5 flex items-center justify-between text-left gap-4"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-[#111827] font-medium text-base">{question}</span>
        <svg
          className={`w-5 h-5 text-[#8aab4c] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-[#6B7280] text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQAccordion({ items = [], grouped = false, groups = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (grouped && groups.length > 0) {
    let globalIndex = 0;
    return (
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-lg font-semibold text-[#111827] mb-3 font-serif">{group.title}</h3>
            <div className="bg-white rounded-xl border border-gray-200 px-6">
              {group.items.map((item) => {
                const idx = globalIndex++;
                return (
                  <AccordionItem
                    key={idx}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openIndex === idx}
                    onToggle={() => handleToggle(idx)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
        />
      ))}
    </div>
  );
}
