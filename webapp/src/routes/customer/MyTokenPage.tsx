import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Ticket,
  Search,
  Phone,
  ArrowRight,
  Scissors,
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useMyQueue } from '@/hooks/useQueue';
import { queuesApi } from '@/api';
import type { QueueTokenOut } from '@/api';
import { toast } from 'react-toastify';

export function MyTokenPage() {
  const { data: myTokens = [], isLoading: isLoadingMyQueue } = useMyQueue();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedToken, setSearchedToken] = useState<QueueTokenOut | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      toast.warning('Please enter a Token ID or phone number.');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      // If looks like UUID
      if (query.length > 20) {
        const token = await queuesApi.getTokenDetails(query);
        setSearchedToken(token);
      } else {
        // Look in my tokens first
        const found = myTokens.find((t) => t.customer_phone?.includes(query));
        if (found) {
          setSearchedToken(found);
        } else {
          setSearchedToken(null);
          toast.info('No token found matching this query.');
        }
      }
    } catch {
      setSearchedToken(null);
      toast.info('No active token found with this ID.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
          Live Token Lookup
        </span>
        <h1 className="text-3xl font-black text-ink">Track My Token</h1>
        <p className="text-sm text-ink-soft">
          Check your active tokens and view live queue wait times in real-time.
        </p>
      </div>

      {/* Lookup Card */}
      <Card className="p-6 sm:p-8 border-mist shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <Input
            label="Token ID or Mobile Phone"
            placeholder="e.g. Enter your token UUID or phone number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Phone className="h-4 w-4 text-ink-soft" />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center bg-coral-500 hover:bg-coral-600 text-white font-bold"
            loading={isSearching}
            leftIcon={<Search className="h-4 w-4" />}
          >
            Find My Token
          </Button>
        </form>
      </Card>

      {/* Searched Token Result */}
      {hasSearched && searchedToken && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-ink">Search Result</h2>
          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-mist bg-mint/20">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary-600 text-white flex flex-col items-center justify-center font-mono font-black text-xl shrink-0">
                <span>#{searchedToken.token_number}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink">{searchedToken.customer_name}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                    {searchedToken.status}
                  </span>
                </div>
                <p className="text-xs text-ink-soft flex items-center gap-1">
                  <Scissors className="h-3 w-3 text-primary-600" />
                  {searchedToken.service_name || 'Haircut'} &bull; {searchedToken.estimated_duration} min
                </p>
              </div>
            </div>

            <Link to="/queue/$id" params={{ id: searchedToken.id }}>
              <Button
                variant="primary"
                size="sm"
                className="w-full sm:w-auto bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Track Live Queue
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {/* My Active Tokens from backend */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">My Active Tokens</h2>
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
            {myTokens.length} active
          </span>
        </div>

        {isLoadingMyQueue ? (
          <div className="py-8 text-center text-sm text-ink-soft">Loading your tokens...</div>
        ) : myTokens.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-mist p-6">
            <Ticket className="h-10 w-10 mx-auto text-ink-soft/40 mb-2" />
            <p className="font-bold text-ink">No active tokens found</p>
            <p className="text-xs text-ink-soft mt-1">
              Join a salon queue to get your live digital token.
            </p>
            <Link to="/salons" className="inline-block mt-4">
              <Button variant="primary" size="sm">
                Explore Salons &amp; Join Queue
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {myTokens.map((tok) => (
              <Card
                key={tok.id}
                hover
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-mist"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary-100 text-primary-800 flex flex-col items-center justify-center font-mono font-black text-xl shrink-0 border border-primary-200">
                    <span>#{tok.token_number}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-ink">{tok.customer_name}</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                        {tok.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft flex items-center gap-1">
                      <Scissors className="h-3 w-3 text-primary-600" />
                      {tok.service_name || 'Haircut'} &bull; {tok.estimated_duration} min
                    </p>
                  </div>
                </div>

                <Link to="/queue/$id" params={{ id: tok.id }}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    Track Live Queue
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
