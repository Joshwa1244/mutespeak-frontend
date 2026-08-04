import React from 'react';
import { useNavigate } from 'react-router-dom';

const ThankYou = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="bg-green-50 p-6 rounded-full mb-6">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Thank You for Your Support!</h1>
            <p className="text-gray-600 mb-8 max-w-md">
                Your contribution helps keep the community running. Your name will appear on the Supporters Wall shortly.
            </p>
            <button 
                onClick={() => navigate('/support')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
                Return to Wall
            </button>
        </div>
    );
};

export default ThankYou;