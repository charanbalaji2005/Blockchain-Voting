import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractJSON from './contract.json';
import toast from 'react-hot-toast';

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111

export function useWeb3() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);

  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID || chainId === 11155111;

  const initContract = useCallback(async (signerOrProvider) => {
    if (!contractJSON?.address || !contractJSON?.abi) return null;
    return new ethers.Contract(contractJSON.address, contractJSON.abi, signerOrProvider);
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected. Please install MetaMask.');
      return null;
    }
    setIsConnecting(true);
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      const accounts = await prov.send('eth_requestAccounts', []);
      const sign = await prov.getSigner();
      const network = await prov.getNetwork();

      setProvider(prov);
      setSigner(sign);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      const c = await initContract(sign);
      setContract(c);
      return accounts[0];
    } catch (err) {
      toast.error('Wallet connection failed.');
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [initContract]);

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: 'Sepolia Test Network',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'SEP', decimals: 18 },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      }
    }
  };

  const castVoteOnChain = async (electionBlockchainId, candidateBlockchainId) => {
    if (!contract || !signer) throw new Error('Wallet not connected');
    if (!isCorrectNetwork) {
      await switchToSepolia();
      throw new Error('Switched network, please try again');
    }

    const gasEstimate = await contract.castVote.estimateGas(electionBlockchainId, candidateBlockchainId);
    const tx = await contract.castVote(electionBlockchainId, candidateBlockchainId, {
      gasLimit: gasEstimate * 120n / 100n, // 20% buffer
    });

    const receipt = await tx.wait();
    return { txHash: tx.hash, receipt };
  };

  const getVoterStatus = async (electionBlockchainId, address) => {
    if (!contract) return null;
    return await contract.getVoterStatus(electionBlockchainId, address);
  };

  // Listen for account/network changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accounts) => {
      setAccount(accounts[0] || null);
      if (!accounts[0]) {
        setSigner(null);
        setContract(null);
      }
    };
    const handleChain = (id) => setChainId(parseInt(id, 16));

    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChain);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccounts);
      window.ethereum.removeListener('chainChanged', handleChain);
    };
  }, []);

  return {
    provider, signer, contract, account,
    isConnecting, chainId, isCorrectNetwork,
    connect, switchToSepolia, castVoteOnChain, getVoterStatus,
  };
}