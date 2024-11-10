import { FiCheckCircle } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';

export const AssetCardLoader = () => {
  return (
    <div className="flex flex-col px-3 py-3 gap-2 border-[1px] border-[#e8f3f1] rounded-md shadow-lg">
      <div className="flex flex-row items-center justify-between">
        <div className="text-sm text-[#464545] font-[600]">
          <Skeleton width={100} />
        </div>
      </div>

      <div className="flex flex-row items-center gap-4">
        <Skeleton circle={true} width={32} height={32} />
        <div className="flex flex-row justify-between items-center flex-1">
          <div className="flex flex-col gap-1">
            <div className="flex flex-row items-center text-base text-[#171717] font-[600] gap-2">
              <Skeleton width={70} />
            </div>
            <div className="flex flex-row items-center text-sm text-[#171717] font-[400]">
              <Skeleton width={50} />
            </div>
          </div>
          <div className="flex flex-row items-center text-base text-[#171717] font-[600] gap-2">
            <Skeleton width={100} />
          </div>
        </div>
      </div>
    </div>
  );
};
