import React, { useState } from 'react';

const EthiopianRegionsCard: React.FC = () => {
    const [isAligned, setIsAligned] = useState(false);

    // Approximate flag gradients for the regions and cities
    const regions = [
        { name: 'Addis Ababa', gradient: 'linear-gradient(135deg, #FFD700 0%, #E91E63 100%)' }, // Yellow to Red stylized
        { name: 'Tigray', gradient: 'linear-gradient(to right, #DA121A 0%, #FCDD09 100%)' },
        { name: 'Afar', gradient: 'linear-gradient(to right, #0077C8 33%, #FFFFFF 33%, #FFFFFF 66%, #00AB4E 66%)' },
        { name: 'Amhara', gradient: 'linear-gradient(to right, #DA121A 0%, #FCDD09 100%)' }, // Similiar colors, distinct pattern usually
        { name: 'Oromia', gradient: 'linear-gradient(to right, #DA121A 33%, #FFFFFF 33%, #FFFFFF 66%, #000000 66%)' },
        { name: 'Somali', gradient: 'linear-gradient(135deg, #418FDE 0%, #418FDE 100%)' }, // Sky Blue
        { name: 'Benishangul-Gumuz', gradient: 'linear-gradient(to right, #000000 33%, #FCDD09 33%, #FCDD09 66%, #00AB4E 66%)' },
        { name: 'SNNP (South)', gradient: 'linear-gradient(to right, #00AB4E 33%, #FFFFFF 33%, #FFFFFF 66%, #DA121A 66%)' },
        { name: 'Gambela', gradient: 'linear-gradient(to right, #000000 25%, #DA121A 25%, #DA121A 50%, #00AB4E 50%, #00AB4E 75%, #FFFFFF 75%)' },
        { name: 'Harari', gradient: 'linear-gradient(to right, #DA121A 20%, #FFFFFF 20%, #FFFFFF 40%, #00AB4E 40%, #00AB4E 60%, #FFFFFF 60%, #DA121A 60%)' },
        { name: 'Dire Dawa', gradient: 'linear-gradient(135deg, #FCDD09 0%, #C7B58B 100%)' },
        { name: 'Sidama', gradient: 'linear-gradient(to right, #DA121A 33%, #FCDD09 33%, #FCDD09 66%, #0077C8 66%)' },
        { name: 'South West', gradient: 'linear-gradient(45deg, #00AB4E, #DA121A, #FCDD09)' },
        { name: 'Central Ethiopia', gradient: 'linear-gradient(45deg, #DA121A, #FFFFFF, #000000)' },
    ];

    return (
        <div
            className="flex justify-center items-center py-10 perspective-1000"
            onClick={() => setIsAligned(!isAligned)}
        >
            <div
                className={`
                    relative w-80 h-96 md:w-96 md:h-[450px]
                    transition-all duration-700 ease-in-out cursor-pointer
                    preserve-3d
                `}
                style={{
                    transform: isAligned ? 'rotateX(0deg) rotateY(0deg)' : 'rotateX(20deg) rotateY(-20deg)',
                    boxShadow: isAligned
                        ? '0 20px 50px -12px rgba(0, 0, 0, 0.25)'
                        : '50px 50px 100px -20px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Card Thickness/Side (Fake 3D) */}
                <div className={`absolute inset-0 bg-gray-900 rounded-2xl transform translate-z-[-10px] ${isAligned ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}></div>

                {/* Main Card Face */}
                <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">

                    {/* Background Grid of Regions */}
                    <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 gap-1 p-1 opacity-80">
                        {regions.map((region, idx) => (
                            <div
                                key={idx}
                                className="w-full h-full rounded-sm"
                                style={{ background: region.gradient }}
                                title={region.name}
                            ></div>
                        ))}
                        {/* Fillers to maintain grid if needed, using generic patterns */}
                        {[...Array(2)].map((_, i) => (
                            <div key={`fill-${i}`} className="bg-gradient-to-br from-gray-100 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-sm"></div>
                        ))}
                    </div>

                    {/* Glass Overlay */}
                    <div className="absolute inset-0 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm"></div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl transform transition-transform duration-500 hover:scale-105">
                            <div className="animate-spin-slow mb-4 mx-auto w-16 h-16 rounded-full border-4 border-t-primary border-r-transparent border-b-secondary border-l-transparent"></div>
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 text-center">
                                Processing <br /> Curriculum Data...
                            </h3>
                            <p className="text-center text-xs text-gray-500 mt-2 font-mono">
                                Analyzing regional standards...
                            </p>
                        </div>
                    </div>

                    {/* Interactive hint */}
                    <div className={`absolute bottom-4 left-0 right-0 text-center text-white/80 text-xs font-bold uppercase tracking-widest transition-opacity duration-300 ${isAligned ? 'opacity-0' : 'opacity-100'}`}>
                        Click to Align
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EthiopianRegionsCard;
