'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bankeu_verification_questionnaires', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      proposal_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'bankeu_proposals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tim_verifikasi_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'tim_verifikasi_kecamatan',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // 13 checklist items - HASIL column (checklist/true/false)
      q1_proposal_ttd_stempel: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Proposal telah ditandatangani oleh Kepala Desa dan diketahui oleh Camat'
      },
      q2_fotocopy_kelengkapan: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Foto copy dokumen kelengkapan proposal'
      },
      q3_rab_format: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'RAB sesuai dengan format yang telah ditentukan'
      },
      q4_volume_realistis: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Volume pekerjaan realistis dan dapat dipertanggungjawabkan'
      },
      q5_harga_satuan: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Harga satuan sesuai dengan harga yang berlaku di daerah'
      },
      q6_lokasi_jelas: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Lokasi kegiatan jelas dan tidak bermasalah'
      },
      q7_kegiatan_fisik: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Kegiatan bersifat fisik infrastruktur atau pemberdayaan masyarakat'
      },
      q8_tidak_tumpang_tindih: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Kegiatan tidak tumpang tindih dengan program lain'
      },
      q9_swakelola: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Swakelola dilaksanakan oleh desa'
      },
      q10_partisipasi_masyarakat: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Masyarakat ikut berpartisipasi (gotong royong)'
      },
      q11_dampak_luas: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Dampak kegiatan dapat dirasakan oleh masyarakat luas'
      },
      q12_dukung_pencapaian: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Kegiatan mendukung pencapaian tujuan pembangunan desa'
      },
      q13_rekomendasi: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Proposal dapat direkomendasikan untuk dibiayai'
      },
      // KET column (keterangan/notes for each question)
      q1_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q2_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q3_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q4_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q5_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q6_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q7_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q8_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q9_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q10_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q11_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q12_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      q13_keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      // Overall assessment
      overall_recommendation: {
        type: Sequelize.ENUM('layak', 'tidak_layak', 'revisi'),
        allowNull: true
      },
      overall_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted'),
        defaultValue: 'draft',
        allowNull: false
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('bankeu_verification_questionnaires', ['proposal_id'], {
      name: 'idx_questionnaire_proposal'
    });
    await queryInterface.addIndex('bankeu_verification_questionnaires', ['tim_verifikasi_id'], {
      name: 'idx_questionnaire_tim'
    });
    await queryInterface.addIndex('bankeu_verification_questionnaires', ['proposal_id', 'tim_verifikasi_id'], {
      name: 'idx_questionnaire_proposal_tim',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('bankeu_verification_questionnaires');
  }
};
