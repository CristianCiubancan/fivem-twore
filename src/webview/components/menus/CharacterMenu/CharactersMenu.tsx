import { useCallback } from 'react';
import { fetchNui } from '../../../../utils/fetchNui';
import { useMenuSystem } from '../../../context/MenuContext';
import CreateCharacterForm from '../../../../plugins/qb_multicharacter/html/components/CreateCharacterForm';
import Button from '../../Button';

// Define a proper type for the character data
export interface CharacterData {
  id: number;
  cid?: number;
  citizenid: string;
  name: string;
  license: string;
  last_updated: number;
  position: string;
  inventory: string;
  gang: string;
  charinfo: {
    account: string;
    firstname: string;
    lastname: string;
    gender: number;
    birthdate: string;
    nationality: string;
    phone: string;
    cid?: number;
  };
  job: {
    name: string;
    grade: {
      level: number;
      name: string;
    };
    type: string;
    isboss: boolean;
    payment: number;
    label: string;
    onduty: boolean;
  };
  money: {
    cash: number;
    bank: number;
    crypto: number;
  };
  metadata: string;
}

const CharactersMenu = ({ characters }: { characters: CharacterData[] }) => {
  const { showMenu } = useMenuSystem();

  const handleOpenCreateForm = useCallback(() => {
    showMenu('central', <CreateCharacterForm characters={characters} />);
  }, [showMenu]);

  // Helper to get a character description based on job or other metadata
  const getCharacterDescription = (character: CharacterData) => {
    return character.job.label || 'Civilian';
  };

  return (
    <div className="p-4 space-y-4 flex flex-col">
      {characters.map((character) => (
        <Button
          key={character.id}
          onClick={async () => {
            // Trigger server to load selected character
            await fetchNui('selectCharacter', { cData: character });
          }}
        >
          <div
            key={character.id}
            className="flex items-center space-x-4 p-4 justify-between"
          >
            <div className="">
              <h2 className="font-semibold">
                {character.charinfo.firstname} {character.charinfo.lastname}
              </h2>
              <p className="text-sm text-gray-400">
                {getCharacterDescription(character)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">ID: {character.citizenid}</p>
              <p className="text-xs text-green-500">
                ${character.money.cash + character.money.bank}
              </p>
            </div>
          </div>
        </Button>
      ))}

      {characters.length < 5 ? (
        <Button type="button" fullWidth onClick={handleOpenCreateForm}>
          <div className="h-24 flex items-center justify-center text-2xl">
            New Character
          </div>
        </Button>
      ) : null}
    </div>
  );
};

export default CharactersMenu;
