import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Gavel, TrendingUp, User, ShieldCheck, XCircle, Users } from 'lucide-react';

const socket = io('http://localhost:5000');


interface Item {
  id: number;
  name: string;
  skill_set: string;
  base_price: number;
  current_bid: number;
  highest_bidder: string | null;
  status: 'available' | 'sold';
  assigned_team: string | null;
}

const TEAMS = ['Kathmandu Knights', 'Pokhara Paltan', 'Biratnagar Blaze', 'Lalitpur Lions'];

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [userRole, setUserRole] = useState<'manager' | 'auctioneer' | null>(null);
  const [managerTeam, setManagerTeam] = useState<string>('');
  const [bidAmounts, setBidAmounts] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    fetchItems();

    socket.on('new_bid', (data) => {
      setItems((prev) => prev.map(item => 
        item.id === data.item_id ? { ...item, current_bid: data.current_bid, highest_bidder: data.highest_bidder, status: data.status || item.status } : item
      ));
    });

    socket.on('bid_accepted', (data) => {
      setItems((prev) => prev.map(item => 
        item.id === data.item_id ? { ...item, status: 'sold', assigned_team: data.assigned_team } : item
      ));
    });


    socket.on('bid_rejected', (data) => {
      setItems((prev) => prev.map(item => 
        item.id === data.item_id ? { ...item, current_bid: data.current_bid, highest_bidder: null } : item
      ));
    });

    return () => {
      socket.off('new_bid');
      socket.off('bid_accepted');
      socket.off('bid_rejected');
    };
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/items');
      setItems(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBid = async (itemId: number) => {
    const amount = bidAmounts[itemId];
    if (!amount) return alert('Enter amount');
    try {
      await axios.post('http://localhost:5000/bid', {
        item_id: itemId,
        bidder_name: managerTeam,
        amount: amount
      });
      setBidAmounts({ ...bidAmounts, [itemId]: 0 });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const acceptBid = async (itemId: number) => {
    try {
      await axios.post('http://localhost:5000/accept-bid', { item_id: itemId });
    } catch (err) {
      console.error(err);
    }
  };

  const rejectBid = async (itemId: number) => {
    try {
      await axios.post('http://localhost:5000/reject-bid', { item_id: itemId });
    } catch (err) {
      console.error(err);
    }
  };

  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <Gavel className="mx-auto text-blue-600 mb-4" size={64} />
          <h1 className="text-3xl font-bold text-gray-800 mb-6">NPL Auction 2026</h1>
          <div className="space-y-4">
            <button 
              onClick={() => setUserRole('auctioneer')}
              className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition"
            >
              Enter as Auctioneer
            </button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">OR</span></div>
            </div>
            <p className="text-sm font-semibold text-gray-600">Select Manager Team</p>
            <div className="grid grid-cols-1 gap-2">
              {TEAMS.map(team => (
                <button 
                  key={team}
                  onClick={() => { setUserRole('manager'); setManagerTeam(team); }}
                  className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availablePlayers = items.filter(i => i.status === 'available');
  const rosters = TEAMS.map(team => ({
    name: team,
    players: items.filter(i => i.status === 'sold' && i.assigned_team === team)
  }));


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Gavel />
            <span className="text-xl font-bold">NPL Bidding 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-blue-800 px-3 py-1 rounded-full text-sm font-medium">
               Mode: {userRole === 'auctioneer' ? 'Auctioneer' : `Manager (${managerTeam})`}
            </span>
            <button onClick={() => setUserRole(null)} className="text-sm hover:underline">Exit</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Auction List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> Active Auction
          </h2>
          {availablePlayers.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border-2 border-dashed border-gray-300 text-center text-gray-500">
              No players currently in auction.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availablePlayers.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded">{item.skill_set}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold">Current Bid</p>
                        <p className="text-2xl font-black text-blue-700">${item.current_bid}</p>
                      </div>
                    </div>

                    {item.highest_bidder ? (
                      <div className="mb-4 bg-green-50 p-2 rounded border border-green-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-green-700">LEADING BID</span>
                        <span className="text-sm font-bold text-green-800">{item.highest_bidder}</span>
                      </div>
                    ) : (
                      <div className="mb-4 bg-gray-50 p-2 rounded text-center">
                        <span className="text-xs font-bold text-gray-400">WAITING FOR BIDS</span>
                      </div>
                    )}

                    {userRole === 'manager' ? (
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Amount"
                          value={bidAmounts[item.id] || ''}
                          onChange={(e) => setBidAmounts({...bidAmounts, [item.id]: parseFloat(e.target.value)})}
                        />
                        <button 
                          onClick={() => handleBid(item.id)}
                          disabled={managerTeam === item.highest_bidder}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
                        >
                          Place Bid
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => acceptBid(item.id)}
                          disabled={!item.highest_bidder}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <ShieldCheck size={18} /> Accept
                        </button>
                        <button 
                          onClick={() => rejectBid(item.id)}
                          disabled={!item.highest_bidder}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <XCircle size={18} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-6 py-2 border-t border-gray-100 flex justify-between">
                    <span className="text-xs text-gray-400">Base: ${item.base_price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Rosters */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" /> Team Rosters
          </h2>
          <div className="space-y-4">
            {rosters.map(team => (
              <div key={team.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-bold text-gray-900 flex justify-between items-center mb-3">
                  {team.name}
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{team.players.length}</span>
                </h3>
                {team.players.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No players won yet.</p>
                ) : (
                  <div className="space-y-2">
                    {team.players.map(p => (
                      <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-blue-50 rounded border border-blue-100">
                        <span className="font-medium">{p.name}</span>
                        <span className="font-bold text-blue-700">${p.current_bid}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

