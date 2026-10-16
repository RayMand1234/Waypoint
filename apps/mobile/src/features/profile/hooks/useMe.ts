import { useQuery } from '@tanstack/react-query';
import { meQuery } from '../utils/meQuery';

export const useMe = () => useQuery(meQuery);
